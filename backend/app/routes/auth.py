import re
import os
import random
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from flask import Blueprint, request, jsonify
from app import db
import bcrypt
import jwt
from app.models.user import User
from app.models.onboarding import OnboardingDetail
from app.models.PasswordResetCode import PasswordResetCode
from app.auth_helper import require_auth

auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email)


def validate_password(password):
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters.')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain an uppercase letter.')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain a lowercase letter.')
    if not re.search(r'\d', password):
        errors.append('Password must contain a number.')
    return errors


def generate_token(user_id, email):
    payload = {
        'user_id': str(user_id),
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, 'nutriplan-secret-key-change-in-prod', algorithm='HS256')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    password_confirmation = data.get('password_confirmation') or ''

    errors = {}

    if not name:
        errors['name'] = 'Name is required.'
    elif len(name) < 2:
        errors['name'] = 'Name must be at least 2 characters.'

    if not email:
        errors['email'] = 'Email is required.'
    elif not validate_email(email):
        errors['email'] = 'Please enter a valid email address.'

    if not password:
        errors['password'] = 'Password is required.'
    else:
        pw_errors = validate_password(password)
        if pw_errors:
            errors['password'] = pw_errors[0]

    if password != password_confirmation:
        errors['password_confirmation'] = 'Passwords do not match.'

    if errors:
        return jsonify({'errors': errors}), 422

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'errors': {'email': 'An account with this email already exists.'}}), 422

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user = User(name=name, email=email, password=hashed.decode('utf-8'))
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, email)

    user_data = user.to_dict()
    user_data['is_admin'] = email == os.environ.get('ADMIN_EMAIL', '')

    return jsonify({
        'token': token,
        'user': user_data,
    })


def send_reset_email(to_email, code):
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USERNAME', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')

    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = 'Your NutriPlan Pro Password Reset Code'
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain='nutriplanpro.com')

    text = f'''Your NutriPlan Pro password reset code is: {code}

This code expires in 10 minutes.

If you did not request this, ignore this email.'''

    html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;padding:32px">
<div style="font-size:20px;font-weight:700;color:#0f766e;margin-bottom:16px">NutriPlan Pro</div>
<p style="font-size:14px;color:#333;line-height:1.5;margin:0 0 16px">You requested a password reset. Your code below expires in 10 minutes.</p>
<div style="text-align:center;margin:24px 0">
<span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:6px;padding:12px 24px;background:#f0fdf4;border-radius:4px;color:#020617;font-family:monospace">{code}</span>
</div>
<p style="font-size:12px;color:#999;margin:0">If you did not request this, ignore this email.</p>
</div>
</body>
</html>'''

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    errors = {}

    if not email:
        errors['email'] = 'Email is required.'
    elif not validate_email(email):
        errors['email'] = 'Please enter a valid email address.'

    if not password:
        errors['password'] = 'Password is required.'

    if errors:
        return jsonify({'errors': errors}), 422

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'errors': {'email': 'No account found with this email.'}}), 422

    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'errors': {'password': 'Incorrect password.'}}), 422

    token = generate_token(user.id, email)

    user_data = user.to_dict()
    user_data['is_admin'] = email == os.environ.get('ADMIN_EMAIL', '')

    return jsonify({
        'token': token,
        'user': user_data,
    })


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'errors': {'email': 'Email is required.'}}), 422

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'errors': {'email': 'No account found with this email.'}}), 422

    code = str(random.randint(100000, 999999))
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    reset = PasswordResetCode(email=email, code=code, expires_at=expires)
    db.session.add(reset)
    db.session.commit()

    try:
        send_reset_email(email, code)
    except Exception as e:
        print(f'Mail send failed: {e}')
        return jsonify({'error': 'Failed to send reset email. Please try again later.'}), 500

    return jsonify({'message': 'A 6-digit code has been sent to your email.', 'email': email})


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()

    if not email or not code:
        return jsonify({'errors': {'code': 'Email and code are required.'}}), 422

    reset = PasswordResetCode.query.filter_by(email=email, code=code, used=False)\
        .order_by(PasswordResetCode.created_at.desc()).first()

    if not reset:
        return jsonify({'errors': {'code': 'Invalid or expired code.'}}), 422

    if datetime.datetime.utcnow() > reset.expires_at:
        return jsonify({'errors': {'code': 'Code has expired. Request a new one.'}}), 422

    reset.used = True
    db.session.commit()

    return jsonify({'message': 'Code verified.', 'email': email})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    password_confirmation = data.get('password_confirmation') or ''

    errors = {}

    if not email:
        errors['email'] = 'Email is required.'

    if not password:
        errors['password'] = 'Password is required.'
    else:
        pw_errors = validate_password(password)
        if pw_errors:
            errors['password'] = pw_errors[0]

    if password != password_confirmation:
        errors['password_confirmation'] = 'Passwords do not match.'

    if errors:
        return jsonify({'errors': errors}), 422

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'errors': {'email': 'No account found.'}}), 422

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user.password = hashed.decode('utf-8')
    db.session.commit()

    return jsonify({'message': 'Password reset successful. You can now log in.'})
