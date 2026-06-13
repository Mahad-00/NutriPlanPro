import os
from functools import wraps
from flask import request, jsonify
import jwt


def get_current_user():
    """Extract and verify JWT token from Authorization header or ?token= query param. Returns user dict or None."""
    auth = request.headers.get('Authorization', '')
    token = None
    if auth.startswith('Bearer '):
        token = auth[7:]
    else:
        token = request.args.get('token', '')
    if not token:
        return None
    try:
        payload = jwt.decode(token, 'nutriplan-secret-key-change-in-prod', algorithms=['HS256'])
        return {'user_id': payload['user_id'], 'email': payload['email']}
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def require_auth(f):
    """Decorator that ensures a valid JWT token is present."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        return f(user, *args, **kwargs)
    return wrapper


def require_admin(f):
    """Decorator that ensures the user is authenticated AND is the admin."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        admin_email = os.environ.get('ADMIN_EMAIL', '')
        if user['email'] != admin_email:
            return jsonify({'error': 'Admin access required.'}), 403
        return f(user, *args, **kwargs)
    return wrapper


def admin_required():
    """View function helper that returns user or raises 401/403. Use in non-decorator patterns."""
    user = get_current_user()
    if not user:
        return None, ('error', 'Authentication required.'), 401
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if user['email'] != admin_email:
        return None, ('error', 'Admin access required.'), 403
    return user, None, None
