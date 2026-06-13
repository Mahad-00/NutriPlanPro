from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.FoodDiary import FoodDiaryEntry
from app.auth_helper import require_auth

food_diary_bp = Blueprint('food_diary', __name__)


@food_diary_bp.route('', methods=['GET'])
@require_auth
def list_entries(current_user):
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date query parameter is required.'}), 400
    try:
        query_date = date_type.fromisoformat(date_str)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 100, type=int), 200)
    q = FoodDiaryEntry.query.filter_by(email=current_user['email'], date=query_date)
    total = q.count()
    entries = q.order_by(FoodDiaryEntry.created_at)\
        .offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({'entries': [e.to_dict() for e in entries], 'total': total, 'page': page, 'per_page': per_page})


@food_diary_bp.route('', methods=['POST'])
@require_auth
def create_entry(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    errors = {}
    name = (data.get('name') or '').strip()
    if not name:
        errors['name'] = 'Name is required.'

    date_str = data.get('date')
    meal_type = data.get('meal_type')
    entry_type = data.get('entry_type')

    if not date_str:
        errors['date'] = 'Date is required.'
    if not meal_type:
        errors['meal_type'] = 'Meal type is required.'
    if not entry_type:
        errors['entry_type'] = 'Entry type is required.'

    if errors:
        return jsonify({'errors': errors}), 422

    try:
        entry_date = date_type.fromisoformat(date_str)
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422

    entry = FoodDiaryEntry(
        email=current_user['email'],
        date=entry_date,
        meal_type=meal_type,
        entry_type=entry_type,
        name=name,
        quantity=float(data.get('quantity', 1)),
        serving_unit=data.get('serving_unit', 'serving'),
        calories=float(data.get('calories', 0)),
        protein=float(data.get('protein', 0)),
        carbs=float(data.get('carbs', 0)),
        fat=float(data.get('fat', 0)),
        fiber=float(data.get('fiber', 0)),
        notes=data.get('notes', ''),
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'entry': entry.to_dict()}), 201


@food_diary_bp.route('/batch', methods=['POST'])
@require_auth
def batch_create(current_user):
    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({'error': 'Expected a JSON array of food items.'}), 400

    entries = []
    for item in data:
        name = (item.get('name') or '').strip()
        if not name:
            return jsonify({'error': 'Each item must have a name.'}), 422
        date_str = item.get('date')
        meal_type = item.get('meal_type')
        if not date_str or not meal_type:
            return jsonify({'error': 'Each item must have date and meal_type.'}), 422
        try:
            entry_date = date_type.fromisoformat(date_str)
        except ValueError:
            return jsonify({'error': f'Invalid date "{date_str}". Use YYYY-MM-DD.'}), 422
        entry = FoodDiaryEntry(
            email=current_user['email'],
            date=entry_date,
            meal_type=meal_type,
            entry_type=item.get('entry_type', 'food'),
            name=name,
            quantity=float(item.get('quantity', 1)),
            serving_unit=item.get('serving_unit', 'serving'),
            calories=float(item.get('calories', 0)),
            protein=float(item.get('protein', 0)),
            carbs=float(item.get('carbs', 0)),
            fat=float(item.get('fat', 0)),
            fiber=float(item.get('fiber', 0)),
        )
        db.session.add(entry)
        entries.append(entry)

    db.session.commit()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 201


@food_diary_bp.route('/<int:entry_id>', methods=['DELETE'])
@require_auth
def delete_entry(current_user, entry_id):
    entry = FoodDiaryEntry.query.filter_by(id=entry_id, email=current_user['email']).first()
    if not entry:
        return jsonify({'error': 'Entry not found.'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted.'})
