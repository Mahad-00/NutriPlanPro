import sys
from flask import Blueprint, request, jsonify
from app.auth_helper import require_auth

recommendation_bp = Blueprint('recommendation', __name__)

# Lazy import: defer loading sentence-transformers/torch until first API call
_REC_FUNCS = {
    'get_engine', 'predict_bmi', 'predict_tdee', 'predict_disease_risk',
    'personalized_nutrition_plan', 'add_rating', 'get_user_history', 'cf_recommend',
}

def __getattr__(name):
    if name in _REC_FUNCS:
        import models.recommendation_engine as _rec_engine
        val = getattr(_rec_engine, name)
        globals()[name] = val
        return val
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def err(msg, code=400):
    return jsonify({"error": msg}), code


@recommendation_bp.route('/health')
def health():
    engine = get_engine()
    return jsonify({"status": "ok", "foods_loaded": len(engine.foods)})


@recommendation_bp.route('/stats')
def stats():
    return jsonify(get_engine().stats())


@recommendation_bp.route('/foods')
def list_foods():
    engine = get_engine()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    source = request.args.get('source')
    f = engine.foods.copy()
    if source:
        f = f[f['source'].str.lower() == source.lower()]
    total = len(f)
    start = (page - 1) * limit
    return jsonify({
        'total': total, 'page': page, 'limit': limit,
        'foods': engine._df_to_records(f.iloc[start:start + limit]),
    })


@recommendation_bp.route('/diet-recommender', methods=['POST'])
@require_auth
def diet_recommender(current_user):
    d = request.get_json(silent=True) or {}
    results = get_engine().recommend(
        goal=d.get('goal'), vegetarian=d.get('vegetarian'),
        vegan=d.get('vegan'), max_calories=d.get('maxCalories'),
        min_protein=d.get('minProtein'), max_fat=d.get('maxFat'),
        spice_level=d.get('spiceLevel'), region=d.get('region'),
        food_category=d.get('foodCategory'), workout=d.get('workout'),
        top_k=int(d.get('topK', 10)), sort_by=d.get('sortBy', 'protein g'),
        ascending=bool(d.get('ascending', False)),
    )
    return jsonify({'count': len(results), 'results': results})


@recommendation_bp.route('/similar-foods', methods=['POST'])
@require_auth
def similar_foods(current_user):
    d = request.get_json(silent=True) or {}
    name = d.get('food_name', '').strip()
    if not name:
        return err("'food_name' is required.")
    results = get_engine().similar_foods(name, top_k=int(d.get('topK', 10)))
    return jsonify({'query': name, 'count': len(results), 'results': results})


@recommendation_bp.route('/search', methods=['POST'])
@require_auth
def semantic_search(current_user):
    d = request.get_json(silent=True) or {}
    q = d.get('query', '').strip()
    if not q:
        return err("'query' is required.")
    results = get_engine().search(q, top_k=int(d.get('topK', 10)))
    return jsonify({'query': q, 'count': len(results), 'results': results})


@recommendation_bp.route('/meal-plan', methods=['POST'])
@require_auth
def meal_plan(current_user):
    d = request.get_json(silent=True) or {}
    return jsonify(get_engine().meal_plan(
        goal=d.get('goal', 'Maintenance'),
        vegetarian=d.get('vegetarian'), vegan=d.get('vegan'),
        max_daily_calories=int(d.get('maxDailyCalories', 2000)),
        region_preference=d.get('region'),
    ))


@recommendation_bp.route('/bmi', methods=['POST'])
@require_auth
def bmi(current_user):
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_bmi(
            weight_kg=float(d['weight_kg']),
            height_cm=float(d['height_cm']),
        ))
    except (KeyError, ValueError) as e:
        return err(str(e))


@recommendation_bp.route('/tdee', methods=['POST'])
@require_auth
def tdee(current_user):
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_tdee(
            weight_kg=float(d['weight_kg']),
            height_cm=float(d['height_cm']),
            age_years=int(d['age']),
            gender=d['gender'],
            activity_level=d['activity_level'],
        ))
    except (KeyError, ValueError) as e:
        return err(str(e))


@recommendation_bp.route('/disease-risk', methods=['POST'])
@require_auth
def disease_risk(current_user):
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_disease_risk(
            bmi=float(d['bmi']),
            age=int(d['age']),
            blood_pressure_systolic=float(d['blood_pressure_systolic']),
            cholesterol_mgdl=float(d['cholesterol_mgdl']),
            fasting_glucose_mgdl=float(d['fasting_glucose_mgdl']),
        ))
    except (KeyError, ValueError) as e:
        return err(str(e))


@recommendation_bp.route('/personalized-plan', methods=['POST'])
@require_auth
def personalized_plan(current_user):
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(personalized_nutrition_plan(
            weight_kg=float(d['weight_kg']),
            height_cm=float(d['height_cm']),
            age_years=int(d['age']),
            gender=d['gender'],
            activity_level=d['activity_level'],
            goal=d.get('goal', 'Maintenance'),
            vegetarian=bool(d.get('vegetarian', False)),
            vegan=bool(d.get('vegan', False)),
            region_preference=d.get('region'),
            engine_instance=get_engine(),
        ))
    except (KeyError, ValueError) as e:
        return err(str(e))


@recommendation_bp.route('/rate', methods=['POST'])
@require_auth
def rate_food(current_user):
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(add_rating(
            user_id=d['user_id'],
            food_name=d['food_name'],
            rating=float(d['rating']),
        ))
    except (KeyError, ValueError) as e:
        return err(str(e))


@recommendation_bp.route('/history')
@require_auth
def history(current_user):
    uid = request.args.get('user_id', '').strip()
    if not uid:
        return err("'user_id' query param is required.")
    return jsonify({'user_id': uid, 'history': get_user_history(uid)})


@recommendation_bp.route('/cf-recommend', methods=['POST'])
@require_auth
def cf_recommend_endpoint(current_user):
    d = request.get_json(silent=True) or {}
    uid = d.get('user_id', '').strip()
    if not uid:
        return err("'user_id' is required.")
    results = cf_recommend(
        user_id=uid,
        engine_instance=get_engine(),
        top_k=int(d.get('topK', 10)),
        goal=d.get('goal'),
    )
    return jsonify({'user_id': uid, 'count': len(results), 'results': results})
