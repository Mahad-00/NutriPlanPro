import os, math, sqlite3, gdown, joblib
import pandas as pd
import numpy as np
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# ── Constants ──────────────────────────────────────────────────
MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = MODELS_DIR

REQUIRED_COLS = [
    "food name", "region", "ingredients", "recipe",
    "serving size", "calories per serving",
    "protein g", "fat g", "carbs g",
    "spice level", "is vegetarian", "is vegan",
    "fitness goal", "recommended portion",
    "workout recommendation", "recommendation reason",
    "food category",
]

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDINGS_PATH = os.path.join(MODELS_DIR, "food_embeddings.pkl")
DATAFRAME_PATH = os.path.join(MODELS_DIR, "food_dataframe.pkl")
RATINGS_DB_PATH = os.path.join(MODELS_DIR, "ratings.db")

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
    "active": 1.725, "very_active": 1.9,
}

# ── Engine instance (lazy) ─────────────────────────────────────
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = initialize()
    return _engine


# ── Initialization ─────────────────────────────────────────────
def initialize():
    os.makedirs(MODELS_DIR, exist_ok=True)

    pak_path = os.path.join(DATA_DIR, "pakistani_foods.csv")
    usa_path = os.path.join(DATA_DIR, "usa_foods.csv")

    if not os.path.exists(pak_path):
        gdown.download(id="1QT7HC31Yc2N1PWwk8raEkOSUP5RLoumS", output=pak_path)
    if not os.path.exists(usa_path):
        gdown.download(id="1VfV78eGSr24sw0bYeIBvgvQEmnnObluS", output=usa_path)

    pak = pd.read_csv(pak_path)
    usa = pd.read_csv(usa_path)
    df = _preprocess(pak, usa)
    food_df, food_embeddings = _build_embeddings(df)

    engine = FoodRecommendationEngine(
        dataframe=food_df,
        embeddings=food_embeddings,
        embed_model_name=EMBEDDING_MODEL_NAME,
    )
    print(f"Recommendation engine ready: {len(food_df)} foods, embedding shape {food_embeddings.shape}")
    return engine


def _preprocess(pak, usa):
    def normalise_columns(df, source_label):
        df.columns = [c.strip().lower() for c in df.columns]
        df["source"] = source_label
        for col in REQUIRED_COLS:
            if col not in df.columns:
                df[col] = ""
        if "food type" in df.columns and "food category" in df.columns:
            df["food category"] = df["food category"].replace("", np.nan).fillna(df["food type"])
        return df

    pak = normalise_columns(pak.copy(), "Pakistan")
    usa = normalise_columns(usa.copy(), "USA")
    df = pd.concat([pak, usa], ignore_index=True)
    df.fillna("", inplace=True)

    for col in ["calories per serving", "protein g", "fat g", "carbs g"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    for col in ["is vegetarian", "is vegan"]:
        df[col] = df[col].astype(str).str.strip().str.upper().map(
            {"TRUE": True, "FALSE": False, "1": True, "0": False}
        ).fillna(False)
    for col in ["food name", "fitness goal", "food category", "spice level",
                 "workout recommendation", "recommendation reason", "ingredients", "region"]:
        df[col] = df[col].astype(str).str.strip()

    before = len(df)
    df.drop_duplicates(subset=["food name"], keep="first", inplace=True)
    df.reset_index(drop=True, inplace=True)
    print(f"Data: {len(df)} unique foods (removed {before - len(df)} dupes)")
    return df


def _build_embeddings(df):
    def build_food_text(row):
        parts = [
            str(row["food name"]), str(row["ingredients"]), str(row["food category"]),
            str(row["fitness goal"]), str(row["spice level"]),
            "vegetarian" if row["is vegetarian"] else "",
            "vegan" if row["is vegan"] else "",
            str(row["workout recommendation"]),
            str(row["recommendation reason"]), str(row["region"]),
        ]
        return " ".join(p for p in parts if p.strip())

    df["food_text"] = df.apply(build_food_text, axis=1)

    if os.path.exists(EMBEDDINGS_PATH) and os.path.exists(DATAFRAME_PATH):
        print("Loading cached embeddings...")
        food_embeddings = joblib.load(EMBEDDINGS_PATH)
        food_df = joblib.load(DATAFRAME_PATH)
    else:
        print(f"Encoding {len(df)} foods with {EMBEDDING_MODEL_NAME}...")
        model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        food_embeddings = model.encode(df["food_text"].tolist(), show_progress_bar=True, batch_size=64)
        food_df = df.copy()
        joblib.dump(food_embeddings, EMBEDDINGS_PATH)
        joblib.dump(food_df, DATAFRAME_PATH)
        print("Embeddings saved to disk.")

    return food_df, food_embeddings


# ══════════════════════════════════════════════════════════════
#  FoodRecommendationEngine class
# ══════════════════════════════════════════════════════════════

class FoodRecommendationEngine:
    def __init__(self, dataframe, embeddings, embed_model_name):
        self.foods = dataframe.reset_index(drop=True)
        self.embeddings = embeddings
        self.embed_model = SentenceTransformer(embed_model_name)

    def _row_to_dict(self, row):
        d = row.to_dict()
        for k, v in d.items():
            if isinstance(v, np.integer): d[k] = int(v)
            elif isinstance(v, np.floating): d[k] = float(v)
            elif isinstance(v, np.bool_): d[k] = bool(v)
            elif isinstance(v, float) and np.isnan(v): d[k] = None
        d.pop("food_text", None)
        return d

    def _df_to_records(self, subset):
        return [self._row_to_dict(row) for _, row in subset.iterrows()]

    def recommend(self, goal=None, vegetarian=None, vegan=None,
                  max_calories=None, min_protein=None, max_fat=None,
                  spice_level=None, region=None, food_category=None,
                  workout=None, top_k=10, sort_by="protein g", ascending=False):
        f = self.foods.copy()
        if goal:
            f = f[f["fitness goal"].str.lower() == goal.lower()]
        if vegetarian is not None:
            f = f[f["is vegetarian"] == vegetarian]
        if vegan is not None:
            f = f[f["is vegan"] == vegan]
        if max_calories is not None:
            f = f[f["calories per serving"] <= float(max_calories)]
        if min_protein is not None:
            f = f[f["protein g"] >= float(min_protein)]
        if max_fat is not None:
            f = f[f["fat g"] <= float(max_fat)]
        if spice_level:
            f = f[f["spice level"].str.lower() == spice_level.lower()]
        if region:
            f = f[f["region"].str.lower().str.contains(region.lower())]
        if food_category:
            f = f[f["food category"].str.lower().str.contains(food_category.lower())]
        if workout:
            f = f[f["workout recommendation"].str.lower().str.contains(workout.lower())]
        if f.empty:
            return []
        if sort_by in f.columns:
            f = f.sort_values(sort_by, ascending=ascending)
        return self._df_to_records(f.head(top_k))

    def similar_foods(self, food_name, top_k=10):
        mask = self.foods["food name"].str.lower() == food_name.lower()
        idx_list = self.foods.index[mask].tolist()
        if not idx_list:
            return self.search(food_name, top_k=top_k)
        idx = idx_list[0]
        query_vec = self.embeddings[idx].reshape(1, -1)
        sims = cosine_similarity(query_vec, self.embeddings)[0]
        top_indices = [i for i in np.argsort(sims)[::-1] if i != idx][:top_k]
        result = self._df_to_records(self.foods.iloc[top_indices])
        for i, item in enumerate(result):
            item["similarity_score"] = round(float(sims[top_indices[i]]), 4)
        return result

    def search(self, query_text, top_k=10, threshold=0.2):
        query_vec = self.embed_model.encode([query_text])
        sims = cosine_similarity(query_vec, self.embeddings)[0]
        top_indices = [i for i in np.argsort(sims)[::-1] if sims[i] >= threshold][:top_k]
        result = self._df_to_records(self.foods.iloc[top_indices])
        for i, item in enumerate(result):
            item["similarity_score"] = round(float(sims[top_indices[i]]), 4)
        return result

    def meal_plan(self, goal="Maintenance", vegetarian=None, vegan=None,
                  max_daily_calories=2000, region_preference=None):
        distribution = {"Breakfast": 0.25, "Lunch": 0.35, "Dinner": 0.30, "Snack": 0.10}
        plan = {}
        used = set()
        totals = {"calories": 0.0, "protein_g": 0.0, "fat_g": 0.0, "carbs_g": 0.0}
        for meal, ratio in distribution.items():
            budget = max_daily_calories * ratio
            candidates = self.recommend(
                goal=goal, vegetarian=vegetarian, vegan=vegan,
                max_calories=budget, region=region_preference,
                top_k=20, sort_by="protein g", ascending=False,
            )
            chosen = None
            for c in candidates:
                if c["food name"] not in used:
                    chosen = c
                    used.add(c["food name"])
                    break
            if chosen is None and candidates:
                chosen = candidates[0]
            plan[meal] = chosen
            if chosen:
                totals["calories"] += chosen.get("calories per serving", 0) or 0
                totals["protein_g"] += chosen.get("protein g", 0) or 0
                totals["fat_g"] += chosen.get("fat g", 0) or 0
                totals["carbs_g"] += chosen.get("carbs g", 0) or 0
        return {"meal_plan": plan, "daily_totals": totals}

    def stats(self):
        f = self.foods
        return {
            "total_foods": int(len(f)),
            "healthy_foods": int(f["food category"].str.lower().str.contains("healthy").sum()),
            "junk_foods": int(f["food category"].str.lower().str.contains("junk").sum()),
            "vegetarian_foods": int(f["is vegetarian"].sum()),
            "vegan_foods": int(f["is vegan"].sum()),
            "sources": f["source"].value_counts().to_dict(),
            "fitness_goals": f["fitness goal"].value_counts().to_dict(),
            "avg_calories": round(float(f["calories per serving"].mean()), 1),
            "avg_protein_g": round(float(f["protein g"].mean()), 1),
        }


# ══════════════════════════════════════════════════════════════
#  Standalone prediction functions
# ══════════════════════════════════════════════════════════════

def predict_bmi(weight_kg, height_cm):
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Height and weight must be positive.")
    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m ** 2)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal weight"
    elif bmi < 30.0:
        category = "Overweight"
    elif bmi < 35.0:
        category = "Obese Class I"
    elif bmi < 40.0:
        category = "Obese Class II"
    else:
        category = "Obese Class III"
    healthy_min = round(18.5 * height_m ** 2, 1)
    healthy_max = round(24.9 * height_m ** 2, 1)
    if bmi < 18.5:
        suggested_goal = "Muscle Gain"
    elif bmi < 25.0:
        suggested_goal = "Maintenance"
    else:
        suggested_goal = "Weight Loss"
    return {
        "bmi": round(bmi, 2), "category": category,
        "healthy_range_kg": f"{healthy_min}–{healthy_max} kg",
        "suggested_goal": suggested_goal,
    }


def predict_tdee(weight_kg, height_cm, age_years, gender, activity_level):
    gender = gender.strip().lower()
    if gender not in ("male", "female"):
        raise ValueError("gender must be 'male' or 'female'.")
    activity_level = activity_level.strip().lower()
    if activity_level not in ACTIVITY_MULTIPLIERS:
        raise ValueError(f"activity_level must be one of: {list(ACTIVITY_MULTIPLIERS)}")
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161
    multiplier = ACTIVITY_MULTIPLIERS[activity_level]
    tdee = bmr * multiplier
    return {
        "bmr": round(bmr, 1), "tdee": round(tdee, 1),
        "activity_level": activity_level,
        "calories_for_weight_loss": round(tdee - 500, 1),
        "calories_for_muscle_gain": round(tdee + 300, 1),
        "calories_for_maintenance": round(tdee, 1),
        "macro_targets": {
            "protein_g": round(weight_kg * 1.8, 1),
            "fat_g": round(tdee * 0.25 / 9, 1),
            "carbs_g": round((tdee - weight_kg * 1.8 * 4 - tdee * 0.25) / 4, 1),
        },
    }


def predict_disease_risk(bmi, age, blood_pressure_systolic, cholesterol_mgdl, fasting_glucose_mgdl):
    risks = {}
    if fasting_glucose_mgdl < 100:
        risks["diabetes"] = {"risk_level": "Low", "note": "Fasting glucose normal (<100 mg/dL)"}
    elif fasting_glucose_mgdl < 126:
        risks["diabetes"] = {"risk_level": "Moderate", "note": "Prediabetes range (100–125 mg/dL) — lifestyle changes recommended"}
    else:
        risks["diabetes"] = {"risk_level": "High", "note": "Fasting glucose ≥126 mg/dL — consult a physician"}

    if blood_pressure_systolic < 120:
        risks["hypertension"] = {"risk_level": "Low", "note": "Normal BP (<120 mmHg systolic)"}
    elif blood_pressure_systolic < 130:
        risks["hypertension"] = {"risk_level": "Low", "note": "Elevated BP (120–129 mmHg) — monitor regularly"}
    elif blood_pressure_systolic < 140:
        risks["hypertension"] = {"risk_level": "Moderate", "note": "Stage 1 hypertension (130–139 mmHg)"}
    else:
        risks["hypertension"] = {"risk_level": "High", "note": "Stage 2 hypertension (≥140 mmHg) — medical attention advised"}

    cv_score = sum([
        cholesterol_mgdl >= 200, cholesterol_mgdl >= 240,
        bmi >= 25, bmi >= 30, age >= 45, age >= 65,
    ])
    if cv_score <= 1:
        risks["cardiovascular"] = {"risk_level": "Low", "note": f"Low Framingham-proxy score ({cv_score}/6)"}
    elif cv_score <= 3:
        risks["cardiovascular"] = {"risk_level": "Moderate", "note": f"Moderate Framingham-proxy score ({cv_score}/6)"}
    else:
        risks["cardiovascular"] = {"risk_level": "High", "note": f"High Framingham-proxy score ({cv_score}/6) — consult a physician"}

    bmi_result = predict_bmi(weight_kg=bmi * (1.70 ** 2), height_cm=170)
    if bmi < 25:
        risks["obesity"] = {"risk_level": "Low", "note": f"BMI {bmi:.1f} — {bmi_result['category']}"}
    elif bmi < 30:
        risks["obesity"] = {"risk_level": "Moderate", "note": f"BMI {bmi:.1f} — {bmi_result['category']}"}
    else:
        risks["obesity"] = {"risk_level": "High", "note": f"BMI {bmi:.1f} — {bmi_result['category']}"}

    levels = [r["risk_level"] for r in risks.values()]
    overall = "High" if "High" in levels else ("Moderate" if "Moderate" in levels else "Low")
    return {
        "overall_risk": overall, "risks": risks,
        "disclaimer": "For informational purposes only. Not a substitute for professional medical advice.",
    }


def personalized_nutrition_plan(weight_kg, height_cm, age_years, gender,
                                 activity_level, goal, vegetarian=False, vegan=False,
                                 region_preference=None, engine_instance=None):
    bmi_result = predict_bmi(weight_kg=weight_kg, height_cm=height_cm)
    tdee_result = predict_tdee(weight_kg, height_cm, age_years, gender, activity_level)
    goal_map = {
        "weight loss": tdee_result["calories_for_weight_loss"],
        "muscle gain": tdee_result["calories_for_muscle_gain"],
        "maintenance": tdee_result["calories_for_maintenance"],
    }
    calorie_target = goal_map.get(goal.lower(), tdee_result["tdee"])
    protein_g = round(weight_kg * 1.8, 1)
    fat_g = round(calorie_target * 0.25 / 9, 1)
    carbs_g = round((calorie_target - protein_g * 4 - fat_g * 9) / 4, 1)

    meal_plan_result = None
    if engine_instance is not None:
        meal_plan_result = engine_instance.meal_plan(
            goal=goal, vegetarian=vegetarian, vegan=vegan,
            max_daily_calories=int(calorie_target), region_preference=region_preference,
        )

    return {
        "user_profile": {
            "weight_kg": weight_kg, "height_cm": height_cm, "age": age_years,
            "gender": gender, "activity_level": activity_level, "goal": goal,
        },
        "bmi": bmi_result, "tdee": tdee_result,
        "calorie_target": calorie_target,
        "macro_targets": {"protein_g": protein_g, "fat_g": fat_g, "carbs_g": carbs_g},
        "meal_plan": meal_plan_result,
    }


# ══════════════════════════════════════════════════════════════
#  Ratings / Collaborative Filtering
# ══════════════════════════════════════════════════════════════

def _get_db():
    conn = sqlite3.connect(RATINGS_DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ratings (
            user_id TEXT NOT NULL, food_name TEXT NOT NULL,
            rating REAL NOT NULL CHECK(rating BETWEEN 1 AND 5),
            ts INTEGER DEFAULT (strftime('%s','now')),
            PRIMARY KEY (user_id, food_name)
        )
    """)
    conn.commit()
    return conn


def add_rating(user_id, food_name, rating):
    if not (1 <= rating <= 5):
        raise ValueError("Rating must be between 1 and 5.")
    conn = _get_db()
    conn.execute("INSERT OR REPLACE INTO ratings (user_id, food_name, rating) VALUES (?,?,?)",
                 (user_id, food_name, float(rating)))
    conn.commit()
    conn.close()
    return {"stored": True, "user_id": user_id, "food_name": food_name, "rating": rating}


def get_user_history(user_id):
    conn = _get_db()
    rows = conn.execute(
        "SELECT food_name, rating FROM ratings WHERE user_id=? ORDER BY rating DESC", (user_id,)
    ).fetchall()
    conn.close()
    return [{"food_name": r[0], "rating": r[1]} for r in rows]


def cf_recommend(user_id, engine_instance, top_k=10, goal=None):
    conn = _get_db()
    all_rows = conn.execute("SELECT user_id, food_name, rating FROM ratings").fetchall()
    conn.close()
    user_history = {r["food_name"] for r in get_user_history(user_id)}

    if not all_rows:
        base = engine_instance.recommend(goal=goal, top_k=top_k)
        for item in base:
            item["cf_note"] = "No rating data yet — showing content-based results."
        return base

    user_items = defaultdict(dict)
    for uid, fname, r in all_rows:
        user_items[uid][fname] = r

    all_users = list(user_items.keys())
    if len(all_users) >= 5:
        try:
            from surprise import SVD, Dataset, Reader
            df_ratings = pd.DataFrame(all_rows, columns=["user", "item", "rating"])
            reader = Reader(rating_scale=(1, 5))
            data = Dataset.load_from_df(df_ratings, reader)
            trainset = data.build_full_trainset()
            svd = SVD(n_factors=20, n_epochs=20, random_state=42)
            svd.fit(trainset)
            all_foods = engine_instance.foods["food name"].tolist()
            unseen = [f for f in all_foods if f not in user_history]
            preds = [(f, svd.predict(user_id, f).est) for f in unseen]
            preds.sort(key=lambda x: -x[1])
            top_names = [p[0] for p in preds[:top_k]]
            candidates = engine_instance.foods[engine_instance.foods["food name"].isin(top_names)]
            results = engine_instance._df_to_records(candidates)
            for item in results:
                score = next(p[1] for p in preds if p[0] == item["food_name"])
                item["cf_score"] = round(score, 3)
                item["cf_note"] = "SVD collaborative filtering"
            return results
        except Exception:
            pass

    all_foods_set = sorted({f for items in user_items.values() for f in items})
    food_idx = {f: i for i, f in enumerate(all_foods_set)}

    def rating_vec(uid):
        v = np.zeros(len(all_foods_set))
        for fname, r in user_items[uid].items():
            v[food_idx[fname]] = r
        return v

    target_vec = rating_vec(user_id)
    similarities = []
    for other_uid in all_users:
        if other_uid == user_id:
            continue
        other_vec = rating_vec(other_uid)
        denom = np.linalg.norm(target_vec) * np.linalg.norm(other_vec)
        sim = float(np.dot(target_vec, other_vec) / denom) if denom > 0 else 0.0
        similarities.append((other_uid, sim))
    similarities.sort(key=lambda x: -x[1])

    food_scores = defaultdict(float)
    food_sim_sum = defaultdict(float)
    for other_uid, sim in similarities[:10]:
        for fname, r in user_items[other_uid].items():
            if fname not in user_history:
                food_scores[fname] += sim * r
                food_sim_sum[fname] += abs(sim)

    scored = [(fname, food_scores[fname] / food_sim_sum[fname])
              for fname in food_scores if food_sim_sum[fname] > 0]
    scored.sort(key=lambda x: -x[1])
    top_names = [s[0] for s in scored[:top_k]]
    candidates = engine_instance.foods[engine_instance.foods["food name"].isin(top_names)]
    results = engine_instance._df_to_records(candidates)
    for item in results:
        score = next((s[1] for s in scored if s[0] == item["food name"]), 0.0)
        item["cf_score"] = round(score, 3)
        item["cf_note"] = "User-similarity collaborative filtering"
    return results


# ── Run as script ──────────────────────────────────────────────
if __name__ == "__main__":
    eng = get_engine()

    print("\n--- Test 1: Filter recommend ---")
    for r in eng.recommend(goal="Weight Loss", vegetarian=True, max_calories=300, top_k=5):
        print(f"  {r['food name']} | {r.get('calories per serving', '-')} cal | {r.get('protein g', '-')}g protein")

    print("\n--- Test 2: Similar foods ---")
    test_food = eng.foods["food name"].iloc[0] if len(eng.foods) > 0 else "Chicken Karahi"
    for r in eng.similar_foods(test_food, top_k=5):
        print(f"  {r['food name']} (score: {r.get('similarity_score', 'N/A')})")

    print("\n--- Test 3: Semantic search ---")
    for r in eng.search("high protein low carb meal", top_k=5):
        print(f"  {r['food name']} (score: {r.get('similarity_score', 'N/A')})")

    print("\n--- Test 4: Meal plan ---")
    plan = eng.meal_plan(goal="Muscle Gain", max_daily_calories=2500)
    for meal, food in plan["meal_plan"].items():
        print(f"  {meal}: {food['food name'] if food else '(none)'} ({food.get('calories per serving', 0) if food else 0} cal)")
    t = plan["daily_totals"]
    print(f"  TOTAL: {t['calories']:.0f} cal | {t['protein_g']:.0f}g P | {t['fat_g']:.0f}g F | {t['carbs_g']:.0f}g C")

    print("\n--- Test 5: BMI ---")
    for w, h in [(55, 165), (75, 175), (100, 170)]:
        r = predict_bmi(w, h)
        print(f"  {w}kg/{h}cm → BMI {r['bmi']} | {r['category']}")

    print("\n--- Test 6: TDEE ---")
    for g, a in [("male", "moderate"), ("female", "active")]:
        r = predict_tdee(70, 170, 30, g, a)
        print(f"  {g}/30yr → BMR {r['bmr']} | TDEE {r['tdee']}")

    print("\n--- Test 7: Disease risk ---")
    for c in [
        dict(bmi=22, age=30, blood_pressure_systolic=115, cholesterol_mgdl=180, fasting_glucose_mgdl=90),
        dict(bmi=28, age=50, blood_pressure_systolic=135, cholesterol_mgdl=220, fasting_glucose_mgdl=112),
    ]:
        d = predict_disease_risk(**c)
        print(f"  BMI {c['bmi']} age {c['age']} → Overall: {d['overall_risk']}")

    print("\n--- Test 8: Personalized plan ---")
    pnp = personalized_nutrition_plan(75, 175, 28, "male", "moderate", "Muscle Gain", engine_instance=eng)
    print(f"  BMI: {pnp['bmi']['bmi']} | TDEE: {pnp['tdee']['tdee']} → target {pnp['calorie_target']} kcal")

    print("\n--- Test 9: CF recommend ---")
    add_rating("user_001", "Chicken Karahi", 5)
    add_rating("user_001", "Grilled Salmon", 4)
    for r in cf_recommend("user_001", eng, top_k=5):
        print(f"  {r['food name']} (score: {r.get('cf_score', 'N/A')}) [{r.get('cf_note', '')}]")

    print("\n✅ All predictions loaded and tested successfully.")
