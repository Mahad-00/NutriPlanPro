from flask import Blueprint, request, jsonify
from app import db
from app.models.CustomFood import CustomFood
from app.auth_helper import require_auth

custom_foods_bp = Blueprint('custom_foods', __name__)


@custom_foods_bp.route('', methods=['GET'])
@require_auth
def list_foods(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = CustomFood.query.filter_by(email=current_user['email'])
    total = q.count()
    foods = q.order_by(CustomFood.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'foods': [f.to_dict() for f in foods], 'total': total, 'page': page, 'per_page': per_page})


@custom_foods_bp.route('', methods=['POST'])
@require_auth
def create_food(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'errors': {'name': 'Name is required.'}}), 422
    food = CustomFood(
        email=current_user['email'],
        name=name,
        brand=data.get('brand', ''),
        barcode=data.get('barcode', ''),
        serving_unit=data.get('serving_unit', 'serving'),
        calories=float(data.get('calories', 0)),
        protein=float(data.get('protein', 0)),
        carbs=float(data.get('carbs', 0)),
        fat=float(data.get('fat', 0)),
        sugar=float(data.get('sugar', 0)),
        sodium=float(data.get('sodium', 0)),
        fiber=float(data.get('fiber', 0)),
        description=data.get('description', ''),
    )
    db.session.add(food)
    db.session.commit()
    return jsonify({'food': food.to_dict()}), 201


@custom_foods_bp.route('/<int:food_id>', methods=['DELETE'])
@require_auth
def delete_food(current_user, food_id):
    food = CustomFood.query.filter_by(id=food_id, email=current_user['email']).first()
    if not food:
        return jsonify({'error': 'Food not found.'}), 404
    db.session.delete(food)
    db.session.commit()
    return jsonify({'message': 'Food deleted.'})
