from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.MealPlan import MealPlan
from app.models.WeeklyCalendar import WeeklyCalendar
from app.models.GroceryItem import GroceryItem
from app.auth_helper import require_auth

meal_plans_bp = Blueprint('meal_plans', __name__)


@meal_plans_bp.route('', methods=['GET'])
@require_auth
def list_plans(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = MealPlan.query.filter_by(email=current_user['email'])
    total = q.count()
    plans = q.order_by(MealPlan.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'plans': [p.to_dict() for p in plans], 'total': total, 'page': page, 'per_page': per_page})


@meal_plans_bp.route('', methods=['POST'])
@require_auth
def create_plan(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'errors': {'title': 'Title is required.'}}), 422

    plan = MealPlan(
        email=current_user['email'],
        title=title,
        starts_on=date_type.fromisoformat(data.get('starts_on', '2026-01-01')),
        ends_on=date_type.fromisoformat(data.get('ends_on', '2026-01-07')),
        duration_days=int(data.get('duration_days', 7)),
        calorie_target=int(data.get('calorie_target', 0)),
        protein_target=int(data.get('protein_target', 0)),
        carb_target=int(data.get('carb_target', 0)),
        fat_target=int(data.get('fat_target', 0)),
        fiber_target=int(data.get('fiber_target', 0)),
        status=data.get('status', 'generated'),
        is_active=data.get('is_active', False),
        dietary_preference=data.get('dietary_preference', 'balanced'),
        goal_type=data.get('goal_type', 'lose_weight'),
        items_count=int(data.get('items_count', 0)),
        notes=data.get('notes', ''),
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify({'plan': plan.to_dict()}), 201


@meal_plans_bp.route('/<int:plan_id>', methods=['PUT'])
@require_auth
def update_plan(current_user, plan_id):
    plan = MealPlan.query.filter_by(id=plan_id, email=current_user['email']).first()
    if not plan:
        return jsonify({'error': 'Plan not found.'}), 404

    data = request.get_json() or {}

    if 'title' in data:
        plan.title = data['title']
    if 'starts_on' in data:
        plan.starts_on = date_type.fromisoformat(data['starts_on'])
    if 'ends_on' in data:
        plan.ends_on = date_type.fromisoformat(data['ends_on'])
    if 'duration_days' in data:
        plan.duration_days = int(data['duration_days'])
    if 'status' in data:
        plan.status = data['status']
    if 'is_active' in data:
        plan.is_active = data['is_active']
    if 'dietary_preference' in data:
        plan.dietary_preference = data['dietary_preference']
    if 'goal_type' in data:
        plan.goal_type = data['goal_type']
    if 'items_count' in data:
        plan.items_count = int(data['items_count'])
    if 'notes' in data:
        plan.notes = data['notes']

    db.session.commit()
    return jsonify({'plan': plan.to_dict()})


@meal_plans_bp.route('/<int:plan_id>', methods=['DELETE'])
@require_auth
def delete_plan(current_user, plan_id):
    plan = MealPlan.query.filter_by(id=plan_id, email=current_user['email']).first()
    if not plan:
        return jsonify({'error': 'Plan not found.'}), 404
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'message': 'Plan deleted.'})


@meal_plans_bp.route('/activate/<int:plan_id>', methods=['POST'])
@require_auth
def activate_plan(current_user, plan_id):
    email = current_user['email']
    MealPlan.query.filter_by(email=email, is_active=True).update({'is_active': False})
    plan = MealPlan.query.filter_by(id=plan_id, email=email).first()
    if not plan:
        return jsonify({'error': 'Plan not found.'}), 404
    plan.is_active = True
    db.session.commit()
    return jsonify({'plan': plan.to_dict()})


FOOD_CATEGORIES = {
    'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'goat', 'mutton', 'bacon', 'sausage', 'ham', 'steak', 'ground', 'mince', 'meatball', 'hot dog', 'pepperoni', 'salami'],
    'Seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'bass', 'trout', 'mackerel', 'sardine', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'seafood', 'tilapia', 'catfish'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'eggs', 'cottage cheese', 'sour cream', 'ice cream', 'half and half', 'ghee'],
    'Produce': ['lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'carrot', 'tomato', 'onion', 'garlic', 'pepper', 'cucumber', 'zucchini', 'squash', 'eggplant', 'cabbage', 'celery', 'avocado', 'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'berries', 'grape', 'mango', 'pineapple', 'watermelon', 'melon', 'peach', 'plum', 'pear', 'cherry', 'kiwi', 'papaya', 'coconut', 'mushroom', 'asparagus', 'green bean', 'pea', 'corn', 'potato', 'sweet potato', 'yam', 'radish', 'beet', 'turnip', 'parsnip', 'artichoke', 'brussels sprout', 'chard', 'collard', 'arugula', 'celery root', 'jicama', 'okra', 'plantain', 'rhubarb', 'shallot', 'watercress', 'herb', 'basil', 'cilantro', 'parsley', 'dill', 'mint', 'rosemary', 'thyme', 'ginger', 'turmeric'],
    'Bakery': ['bread', 'roll', 'bun', 'bagel', 'croissant', 'muffin', 'cake', 'cookie', 'biscuit', 'pancake', 'waffle', 'tortilla', 'pita', 'naan', 'loaf', 'pastry', 'dough', 'crust', 'flatbread', 'english muffin'],
    'Frozen': ['frozen', 'ice cream', 'popsicle'],
    'Beverages': ['water', 'juice', 'soda', 'tea', 'coffee', 'smoothie', 'shake', 'drink', 'beverage', 'wine', 'beer', 'cider', 'kombucha', 'lemonade', 'milkshake'],
    'Snacks': ['chip', 'cracker', 'popcorn', 'pretzel', 'nut mix', 'trail mix', 'granola bar', 'protein bar', 'energy bar', 'chocolate bar', 'candy', 'gummy'],
    'Spices': ['spice', 'herb', 'salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'oregano', 'basil', 'thyme', 'rosemary', 'bay leaf', 'curry', 'garlic powder', 'onion powder', 'chili powder'],
    'Pantry': ['rice', 'pasta', 'noodle', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 'soy sauce', 'ketchup', 'mustard', 'mayonnaise', 'canned', 'jar', 'bean', 'lentil', 'chickpea', 'oat', 'cereal', 'granola', 'nut', 'almond', 'walnut', 'cashew', 'peanut', 'seed', 'chia', 'flax', 'quinoa', 'couscous', 'barley', 'bulgur', 'protein powder', 'broth', 'stock', 'honey', 'syrup', 'molasses', 'jam', 'jelly', 'peanut butter', 'almond butter', 'hummus', 'olive', 'pickle', 'salsa', 'tomato sauce', 'pasta sauce'],
}


def categorize_food(name):
    name_lower = name.lower()
    for cat, keywords in FOOD_CATEGORIES.items():
        if any(kw in name_lower for kw in keywords):
            return cat
    return 'Other'


@meal_plans_bp.route('/<int:plan_id>/generate-grocery-list', methods=['POST'])
@require_auth
def generate_grocery_list(current_user, plan_id):
    email = current_user['email']
    plan = MealPlan.query.filter_by(id=plan_id, email=email).first()
    if not plan:
        return jsonify({'error': 'Plan not found.'}), 404

    # Delete any existing grocery items for this plan
    GroceryItem.query.filter_by(email=email, plan_id=plan_id).delete()

    entries = WeeklyCalendar.query.filter(
        WeeklyCalendar.email == email,
        WeeklyCalendar.date >= plan.starts_on,
        WeeklyCalendar.date <= plan.ends_on,
    ).all()

    if not entries:
        return jsonify({'error': 'No meals found in this plan.'}), 404

    meal_counts = {}
    for entry in entries:
        name = entry.name.strip()
        if name:
            meal_counts[name] = meal_counts.get(name, 0) + 1

    items = []
    for name, count in meal_counts.items():
        category = categorize_food(name)
        item = GroceryItem(
            email=email,
            name=name,
            category=category,
            quantity=count,
            unit='serving',
            plan_id=plan_id,
        )
        db.session.add(item)
        items.append(item)

    db.session.commit()
    return jsonify({'items': [i.to_dict() for i in items], 'dietary_preference': plan.dietary_preference, 'goal_type': plan.goal_type}), 201
