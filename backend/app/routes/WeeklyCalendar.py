from datetime import date as date_type, timedelta
from flask import Blueprint, request, jsonify
from app import db
from app.models.WeeklyCalendar import WeeklyCalendar
from app.auth_helper import require_auth

weekly_calendar_bp = Blueprint('weekly_calendar', __name__)


@weekly_calendar_bp.route('', methods=['GET'])
@require_auth
def list_week(current_user):
    week_start_str = request.args.get('week_start')
    try:
        week_start = date_type.fromisoformat(week_start_str) if week_start_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'week_start': 'Invalid date format.'}}), 422

    if week_start.weekday() != 6:
        week_start -= timedelta(days=(week_start.weekday() + 1))
    week_end = week_start + timedelta(days=6)

    entries = WeeklyCalendar.query.filter_by(email=current_user['email'])\
        .filter(WeeklyCalendar.date >= week_start, WeeklyCalendar.date <= week_end)\
        .order_by(WeeklyCalendar.date, WeeklyCalendar.created_at).all()

    days = {}
    for i in range(7):
        d = week_start + timedelta(days=i)
        days[d.isoformat()] = []

    for e in entries:
        days[e.date.isoformat()].append(e.to_dict())

    return jsonify({
        'week_start': week_start.isoformat(),
        'week_end': week_end.isoformat(),
        'days': days,
    })


@weekly_calendar_bp.route('', methods=['POST'])
@require_auth
def create_entry(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    date_str = data.get('date')
    name = (data.get('name') or '').strip()
    if not date_str:
        return jsonify({'errors': {'date': 'Date is required.'}}), 422
    if not name:
        return jsonify({'errors': {'name': 'Meal name is required.'}}), 422

    try:
        entry_date = date_type.fromisoformat(date_str)
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422

    entry = WeeklyCalendar(
        email=current_user['email'],
        date=entry_date,
        meal_type=data.get('meal_type', 'meal'),
        name=name,
        calories=int(data.get('calories', 0)),
        protein=int(data.get('protein', 0)),
        carbs=int(data.get('carbs', 0)),
        fat=int(data.get('fat', 0)),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@weekly_calendar_bp.route('/<int:entry_id>', methods=['DELETE'])
@require_auth
def delete_entry(current_user, entry_id):
    entry = WeeklyCalendar.query.filter_by(id=entry_id, email=current_user['email']).first()
    if not entry:
        return jsonify({'error': 'Entry not found.'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted.'})


@weekly_calendar_bp.route('/<int:entry_id>', methods=['PUT'])
@require_auth
def update_entry(current_user, entry_id):
    entry = WeeklyCalendar.query.filter_by(id=entry_id, email=current_user['email']).first()
    if not entry:
        return jsonify({'error': 'Entry not found.'}), 404

    data = request.get_json() or {}

    if 'date' in data:
        try:
            entry.date = date_type.fromisoformat(data['date'])
        except ValueError:
            return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    if 'meal_type' in data:
        entry.meal_type = data['meal_type']
    if 'name' in data:
        entry.name = data['name']
    if 'calories' in data:
        entry.calories = int(data['calories'])
    if 'protein' in data:
        entry.protein = int(data['protein'])
    if 'carbs' in data:
        entry.carbs = int(data['carbs'])
    if 'fat' in data:
        entry.fat = int(data['fat'])

    db.session.commit()
    return jsonify({'entry': entry.to_dict()})
