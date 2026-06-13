from flask import Blueprint, request, jsonify
from app import db
from app.models.BarcodeFood import BarcodeFood
from app.auth_helper import require_auth

barcode_foods_bp = Blueprint('barcode_foods', __name__)


@barcode_foods_bp.route('', methods=['GET'])
@require_auth
def list_barcode_foods(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = BarcodeFood.query.filter_by(email=current_user['email'])
    total = q.count()
    foods = q.order_by(BarcodeFood.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'barcode_foods': [f.to_dict() for f in foods], 'total': total, 'page': page, 'per_page': per_page})


@barcode_foods_bp.route('', methods=['POST'])
@require_auth
def save_barcode_food(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    barcode = (data.get('barcode') or '').strip()
    name = (data.get('name') or '').strip()
    if not barcode:
        return jsonify({'errors': {'barcode': 'Barcode is required.'}}), 422
    if not name:
        return jsonify({'errors': {'name': 'Name is required.'}}), 422

    existing = BarcodeFood.query.filter_by(email=current_user['email'], barcode=barcode).first()
    if existing:
        existing.name = name
        existing.brand = data.get('brand', '')
        existing.serving_size = float(data.get('serving_size', 1))
        existing.serving_unit = data.get('serving_unit', 'serving')
        existing.calories = float(data.get('calories', 0))
        existing.protein = float(data.get('protein', 0))
        existing.carbs = float(data.get('carbs', 0))
        existing.fat = float(data.get('fat', 0))
        existing.fiber = float(data.get('fiber', 0))
        db.session.commit()
        return jsonify({'barcode_food': existing.to_dict()})

    food = BarcodeFood(
        email=current_user['email'],
        barcode=barcode,
        name=name,
        brand=data.get('brand', ''),
        serving_size=float(data.get('serving_size', 1)),
        serving_unit=data.get('serving_unit', 'serving'),
        calories=float(data.get('calories', 0)),
        protein=float(data.get('protein', 0)),
        carbs=float(data.get('carbs', 0)),
        fat=float(data.get('fat', 0)),
        fiber=float(data.get('fiber', 0)),
    )
    db.session.add(food)
    db.session.commit()
    return jsonify({'barcode_food': food.to_dict()}), 201


@barcode_foods_bp.route('/<int:food_id>', methods=['DELETE'])
@require_auth
def delete_barcode_food(current_user, food_id):
    food = BarcodeFood.query.filter_by(id=food_id, email=current_user['email']).first()
    if not food:
        return jsonify({'error': 'Barcode food not found.'}), 404
    db.session.delete(food)
    db.session.commit()
    return jsonify({'message': 'Barcode food deleted.'})
