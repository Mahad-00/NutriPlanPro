import os
import cloudinary
import cloudinary.uploader
from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.MealScan import MealScan
from app.auth_helper import require_auth

meal_scan_bp = Blueprint('meal_scan', __name__)


def _cloudinary_upload(file, folder):
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = os.environ.get('CLOUDINARY_API_KEY')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
    if not cloud_name or not api_key or not api_secret:
        raise RuntimeError('Cloudinary credentials not set in .env')
    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
    return cloudinary.uploader.upload(file, folder=folder)


@meal_scan_bp.route('/upload', methods=['POST'])
@require_auth
def upload_image(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided.'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty file.'}), 400
    try:
        result = _cloudinary_upload(file, 'meal_scans')
        return jsonify({'url': result['secure_url']}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@meal_scan_bp.route('', methods=['POST'])
@require_auth
def create_scan(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    image_url = (data.get('image_url') or '').strip()
    date_str = data.get('date')
    meal_type = data.get('meal_type')
    if not image_url:
        return jsonify({'errors': {'image_url': 'Image URL is required.'}}), 422
    if not date_str:
        return jsonify({'errors': {'date': 'Date is required.'}}), 422
    if not meal_type:
        return jsonify({'errors': {'meal_type': 'Meal type is required.'}}), 422
    try:
        scan_date = date_type.fromisoformat(date_str)
    except ValueError:
        return jsonify({'errors': {'date': 'Invalid date format.'}}), 422
    scan = MealScan(
        email=current_user['email'],
        image_url=image_url,
        date=scan_date,
        meal_type=meal_type,
        notes=data.get('notes', ''),
    )
    db.session.add(scan)
    db.session.commit()
    return jsonify({'scan': scan.to_dict()}), 201


@meal_scan_bp.route('', methods=['GET'])
@require_auth
def list_scans(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = MealScan.query.filter_by(email=current_user['email'])
    total = q.count()
    scans = q.order_by(MealScan.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'scans': [s.to_dict() for s in scans], 'total': total, 'page': page, 'per_page': per_page})
