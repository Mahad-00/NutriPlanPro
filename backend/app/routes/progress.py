import os
import cloudinary
import cloudinary.uploader
from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.ProgressEntry import ProgressEntry
from app.auth_helper import require_auth


def _cloudinary_upload(file, folder):
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    )
    return cloudinary.uploader.upload(file, folder=folder)

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('', methods=['GET'])
@require_auth
def list_entries(current_user):
    entry_type = request.args.get('type')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = ProgressEntry.query.filter_by(email=current_user['email'])
    if entry_type:
        q = q.filter_by(entry_type=entry_type)
    total = q.count()
    entries = q.order_by(ProgressEntry.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'entries': [e.to_dict() for e in entries], 'total': total, 'page': page, 'per_page': per_page})


@progress_bp.route('', methods=['POST'])
@require_auth
def create_entry(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    entry_type = data.get('entry_type')
    if not entry_type or entry_type not in ('weight', 'measurement', 'photo'):
        return jsonify({'errors': {'entry_type': 'Type must be weight, measurement, or photo.'}}), 422
    date_str = data.get('date')
    try:
        entry_date = date_type.fromisoformat(date_str) if date_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    entry = ProgressEntry(
        email=current_user['email'],
        entry_type=entry_type,
        date=entry_date,
        weight=float(data['weight']) if entry_type == 'weight' and data.get('weight') else None,
        waist=float(data['waist']) if entry_type == 'measurement' and data.get('waist') else None,
        chest=float(data['chest']) if entry_type == 'measurement' and data.get('chest') else None,
        hips=float(data['hips']) if entry_type == 'measurement' and data.get('hips') else None,
        arms=float(data['arms']) if entry_type == 'measurement' and data.get('arms') else None,
        thighs=float(data['thighs']) if entry_type == 'measurement' and data.get('thighs') else None,
        filename=data.get('filename', ''),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@progress_bp.route('/upload-photo', methods=['POST'])
@require_auth
def upload_photo(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided.'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty file.'}), 400
    date_str = request.form.get('date')
    try:
        entry_date = date_type.fromisoformat(date_str) if date_str else date_type.today()
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    try:
        result = _cloudinary_upload(file, 'progress')
        image_url = result['secure_url']
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    entry = ProgressEntry(
        email=current_user['email'],
        entry_type='photo',
        date=entry_date,
        filename=image_url,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@progress_bp.route('/<int:entry_id>', methods=['DELETE'])
@require_auth
def delete_entry(current_user, entry_id):
    entry = ProgressEntry.query.filter_by(id=entry_id, email=current_user['email']).first()
    if not entry:
        return jsonify({'error': 'Entry not found.'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted.'})
