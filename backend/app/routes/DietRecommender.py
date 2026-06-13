from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.DietRecommendation import DietRecommendation
from app.auth_helper import require_auth

diet_recommender_bp = Blueprint('diet_recommender', __name__)


@diet_recommender_bp.route('', methods=['GET'])
@require_auth
def list_recommendations(current_user):
    date_str = request.args.get('date')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = DietRecommendation.query.filter_by(email=current_user['email'])
    if date_str:
        try:
            query_date = date_type.fromisoformat(date_str)
            q = q.filter_by(date=query_date)
        except ValueError:
            pass
    total = q.count()
    items = q.order_by(DietRecommendation.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'recommendations': [r.to_dict() for r in items], 'total': total, 'page': page, 'per_page': per_page})


@diet_recommender_bp.route('', methods=['POST'])
@require_auth
def create_recommendation(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'errors': {'name': 'Name is required.'}}), 422
    date_str = data.get('date')
    try:
        entry_date = date_type.fromisoformat(date_str) if date_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    rec = DietRecommendation(
        email=current_user['email'],
        name=name,
        brand=data.get('brand', ''),
        fit_score=int(data.get('fit_score', 0)),
        kcal=float(data.get('kcal', 0)),
        protein=float(data.get('protein', 0)),
        carbs=float(data.get('carbs', 0)),
        fiber=float(data.get('fiber', 0)),
        meal_type=data.get('meal_type', ''),
        date=entry_date,
        action_taken=data.get('action_taken', 'added'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify({'recommendation': rec.to_dict()}), 201
