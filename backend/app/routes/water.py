from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.WaterLog import WaterLog
from app.auth_helper import require_auth

water_bp = Blueprint('water', __name__)


@water_bp.route('', methods=['GET'])
@require_auth
def list_logs(current_user):
    date_str = request.args.get('date')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = WaterLog.query.filter_by(email=current_user['email'])
    if date_str:
        try:
            query_date = date_type.fromisoformat(date_str)
            q = q.filter_by(date=query_date)
        except ValueError:
            pass
    total = q.count()
    logs = q.order_by(WaterLog.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'logs': [l.to_dict() for l in logs], 'total': total, 'page': page, 'per_page': per_page})


@water_bp.route('', methods=['POST'])
@require_auth
def create_log(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    date_str = data.get('date')
    try:
        log_date = date_type.fromisoformat(date_str) if date_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    log = WaterLog(
        email=current_user['email'],
        date=log_date,
        ml=int(data.get('ml', 0)),
        time=data.get('time', ''),
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'log': log.to_dict()}), 201


@water_bp.route('/<int:log_id>', methods=['DELETE'])
@require_auth
def delete_log(current_user, log_id):
    log = WaterLog.query.filter_by(id=log_id, email=current_user['email']).first()
    if not log:
        return jsonify({'error': 'Log not found.'}), 404
    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Log deleted.'})
