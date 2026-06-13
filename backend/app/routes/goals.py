from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.goal import Goal
from app.auth_helper import require_auth

goals_bp = Blueprint('goals', __name__)


@goals_bp.route('', methods=['GET'])
@require_auth
def list_goals(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = Goal.query.filter_by(email=current_user['email'])
    total = q.count()
    goals = q.order_by(Goal.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'goals': [g.to_dict() for g in goals], 'total': total, 'page': page, 'per_page': per_page})


@goals_bp.route('', methods=['POST'])
@require_auth
def create_goal(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    date_str = data.get('date')
    try:
        entry_date = date_type.fromisoformat(date_str) if date_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    goal = Goal(
        email=current_user['email'],
        calorie_goal=float(data.get('calorie_goal', 0)),
        protein_goal=float(data.get('protein_goal', 0)),
        carb_goal=float(data.get('carb_goal', 0)),
        fat_goal=float(data.get('fat_goal', 0)),
        goal_type=data.get('goal_type', 'lose_weight'),
        date=entry_date,
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({'goal': goal.to_dict()}), 201
