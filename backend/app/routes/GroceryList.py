from flask import Blueprint, request, jsonify
from app import db
from app.models.GroceryItem import GroceryItem
from app.auth_helper import require_auth

grocery_list_bp = Blueprint('grocery_list', __name__)


@grocery_list_bp.route('', methods=['GET'])
@require_auth
def list_items(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 100, type=int), 200)
    q = GroceryItem.query.filter_by(email=current_user['email'])
    total = q.count()
    items = q.order_by(GroceryItem.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'items': [i.to_dict() for i in items], 'total': total, 'page': page, 'per_page': per_page})


@grocery_list_bp.route('', methods=['POST'])
@require_auth
def create_item(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'errors': {'name': 'Name is required.'}}), 422
    item = GroceryItem(
        email=current_user['email'],
        name=name,
        category=data.get('category', 'Produce'),
        quantity=float(data.get('quantity', 1)),
        unit=data.get('unit', 'item'),
        purchased=data.get('purchased', False),
        plan_id=data.get('plan_id'),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'item': item.to_dict()}), 201


@grocery_list_bp.route('/<int:item_id>', methods=['PUT'])
@require_auth
def update_item(current_user, item_id):
    item = GroceryItem.query.filter_by(id=item_id, email=current_user['email']).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404
    data = request.get_json() or {}
    if 'name' in data:
        item.name = data['name']
    if 'category' in data:
        item.category = data['category']
    if 'quantity' in data:
        item.quantity = float(data['quantity'])
    if 'unit' in data:
        item.unit = data['unit']
    if 'purchased' in data:
        item.purchased = data['purchased']
    db.session.commit()
    return jsonify({'item': item.to_dict()})


@grocery_list_bp.route('/<int:item_id>', methods=['DELETE'])
@require_auth
def delete_item(current_user, item_id):
    item = GroceryItem.query.filter_by(id=item_id, email=current_user['email']).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted.'})


@grocery_list_bp.route('/clear-purchased', methods=['POST'])
@require_auth
def clear_purchased(current_user):
    GroceryItem.query.filter_by(email=current_user['email'], purchased=True).delete()
    db.session.commit()
    return jsonify({'message': 'Purchased items cleared.'})
