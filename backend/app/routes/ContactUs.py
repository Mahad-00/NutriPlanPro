from flask import Blueprint, request, jsonify
from app import db
from app.models.ContactUs import ContactUs
from app.auth_helper import require_admin

contact_bp = Blueprint('contact', __name__)


@contact_bp.route('', methods=['POST'])
def submit_contact():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()

    errors = {}
    if not name:
        errors['name'] = 'Name is required.'
    if not email:
        errors['email'] = 'Email is required.'
    if not subject:
        errors['subject'] = 'Subject is required.'
    if not message:
        errors['message'] = 'Message is required.'

    if errors:
        return jsonify({'errors': errors}), 422

    entry = ContactUs(name=name, email=email, subject=subject, message=message)
    db.session.add(entry)
    db.session.commit()

    return jsonify({'message': 'Message sent.', 'entry': entry.to_dict()}), 201


@contact_bp.route('', methods=['GET'])
@require_admin
def list_contacts(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = ContactUs.query.order_by(ContactUs.created_at.desc())
    total = q.count()
    entries = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'entries': [e.to_dict() for e in entries], 'total': total, 'page': page, 'per_page': per_page})
