import os
import csv
import io
import smtplib
from datetime import datetime, timedelta, date as date_type
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from flask import Blueprint, jsonify, request, Response
from app.auth_helper import require_admin
from app.models.user import User
from app.models.ContactUs import ContactUs
from app.models.FoodDiary import FoodDiaryEntry
from app.models.MealPlan import MealPlan
from app.models.MealScan import MealScan
from app.models.onboarding import OnboardingDetail
from app.models.goal import Goal
from app.models.WaterLog import WaterLog
from app.models.DietRecommendation import DietRecommendation
from app.models.ProgressEntry import ProgressEntry
from app.models.WorkoutLog import WorkoutLog
from app.models.WorkoutRoutine import WorkoutRoutine
from app.models.WeeklyCalendar import WeeklyCalendar
from app.models.GroceryItem import GroceryItem
from app.models.BarcodeFood import BarcodeFood
from app.models.CustomFood import CustomFood
from app.models.recipe import Recipe
from app.models.PasswordResetCode import PasswordResetCode
from app import db

admin_bp = Blueprint('admin', __name__)

CASCADE_MODELS = [
    OnboardingDetail, Goal, DietRecommendation, WaterLog, MealPlan,
    MealScan, FoodDiaryEntry, ProgressEntry, WorkoutLog, WorkoutRoutine,
    WeeklyCalendar, GroceryItem, BarcodeFood, CustomFood,
    Recipe, PasswordResetCode,
]


# ── Analytics ───────────────────────────────────────────────────────────

@admin_bp.route('/analytics', methods=['GET'])
@require_admin
def analytics(current_user):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    total_users = User.query.count()
    onboarding_count = OnboardingDetail.query.count()
    nutrition = db.session.query(
        db.func.avg(FoodDiaryEntry.calories).label('avg_cal'),
        db.func.avg(FoodDiaryEntry.protein).label('avg_protein'),
        db.func.avg(FoodDiaryEntry.carbs).label('avg_carbs'),
        db.func.avg(FoodDiaryEntry.fat).label('avg_fat'),
    ).filter(FoodDiaryEntry.date >= seven_days_ago.date()).first()

    active_7d = db.session.query(FoodDiaryEntry.email).filter(
        FoodDiaryEntry.date >= seven_days_ago.date()
    ).distinct().count()

    active_30d = db.session.query(FoodDiaryEntry.email).filter(
        FoodDiaryEntry.date >= thirty_days_ago.date()
    ).distinct().count()

    # Daily active users counts for last 14 days
    daily_active = []
    for i in range(13, -1, -1):
        day = (now - timedelta(days=i)).date()
        count = db.session.query(FoodDiaryEntry.email).filter(
            FoodDiaryEntry.date == day
        ).distinct().count()
        daily_active.append({'date': day.isoformat(), 'count': count})

    # Goal type distribution
    goal_dist = db.session.query(
        Goal.goal_type, db.func.count(Goal.id)
    ).group_by(Goal.goal_type).all()
    goal_distribution = [{'type': r[0] or 'unknown', 'count': r[1]} for r in goal_dist]

    # Dietary preference breakdown from onboarding
    diet_prefs = db.session.query(
        OnboardingDetail.dietary_preference, db.func.count(OnboardingDetail.id)
    ).group_by(OnboardingDetail.dietary_preference).all()
    dietary_breakdown = [{'preference': r[0] or 'unknown', 'count': r[1]} for r in diet_prefs]

    return jsonify({
        'total_users': total_users,
        'onboarding_rate': round(onboarding_count / total_users * 100, 1) if total_users else 0,
        'nutrition_averages': {
            'avg_calories': round(nutrition.avg_cal, 1) if nutrition.avg_cal else 0,
            'avg_protein': round(nutrition.avg_protein, 1) if nutrition.avg_protein else 0,
            'avg_carbs': round(nutrition.avg_carbs, 1) if nutrition.avg_carbs else 0,
            'avg_fat': round(nutrition.avg_fat, 1) if nutrition.avg_fat else 0,
        } if nutrition else {},
        'active_users_7d': active_7d,
        'active_users_30d': active_30d,
        'daily_active_users': daily_active,
        'goal_distribution': goal_distribution,
        'dietary_breakdown': dietary_breakdown,
    })


# ── Users (list, search, filter, sort, paginate, export, bulk-delete) ──

@admin_bp.route('/users', methods=['GET'])
@require_admin
def users(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = (request.args.get('search') or '').strip()
    sort_by = request.args.get('sort_by', 'created_at')
    sort_dir = request.args.get('sort_dir', 'desc')

    allowed_sort = {'id', 'name', 'email', 'created_at'}
    if sort_by not in allowed_sort:
        sort_by = 'created_at'

    q = User.query
    if search:
        like = f'%{search}%'
        q = q.filter(
            User.name.ilike(like) | User.email.ilike(like)
        )

    sort_col = getattr(User, sort_by)
    order = sort_col.desc() if sort_dir == 'desc' else sort_col.asc()
    q = q.order_by(order)

    total = q.count()
    users_data = q.offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for u in users_data:
        d = u.to_dict()
        d['meal_plans_count'] = MealPlan.query.filter_by(email=u.email).count()
        d['diary_entries_count'] = FoodDiaryEntry.query.filter_by(email=u.email).count()
        d['scans_count'] = MealScan.query.filter_by(email=u.email).count()
        d['has_onboarding'] = OnboardingDetail.query.filter_by(email=u.email).count() > 0
        result.append(d)

    return jsonify({
        'users': result,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page,
    })


@admin_bp.route('/users/<int:user_id>/details', methods=['GET'])
@require_admin
def user_details(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    email = user.email
    onboarding = OnboardingDetail.query.filter_by(email=email).first()
    goals = Goal.query.filter_by(email=email).all()
    water_logs = WaterLog.query.filter_by(email=email).order_by(WaterLog.date.desc()).limit(10).all()
    meal_plans = MealPlan.query.filter_by(email=email).order_by(MealPlan.created_at.desc()).all()
    meal_scans = MealScan.query.filter_by(email=email).order_by(MealScan.date.desc()).limit(10).all()
    diary_entries = FoodDiaryEntry.query.filter_by(email=email).order_by(FoodDiaryEntry.date.desc()).limit(20).all()
    barcode_foods = BarcodeFood.query.filter_by(email=email).order_by(BarcodeFood.created_at.desc()).limit(10).all()
    recipes = Recipe.query.filter_by(email=email).order_by(Recipe.created_at.desc()).limit(10).all()
    custom_foods = CustomFood.query.filter_by(email=email).order_by(CustomFood.created_at.desc()).limit(10).all()

    # Activity timeline — merge recent entries from multiple tables
    timeline = []
    for e in diary_entries:
        timeline.append({'date': e.date.isoformat(), 'type': 'diary', 'label': f'Added {e.name}'})
    for p in meal_plans:
        timeline.append({'date': p.created_at.date().isoformat(), 'type': 'meal_plan', 'label': f'Created plan "{p.title}"'})
    for s in meal_scans:
        timeline.append({'date': s.date.isoformat(), 'type': 'scan', 'label': f'Scanned {s.meal_type}'})
    for w in water_logs:
        timeline.append({'date': w.date.isoformat(), 'type': 'water', 'label': f'Logged {w.ml}ml water'})

    timeline.sort(key=lambda x: x['date'], reverse=True)

    return jsonify({
        'user': user.to_dict(),
        'onboarding': onboarding.to_dict() if onboarding else None,
        'goals': [g.to_dict() for g in goals],
        'water_logs': [w.to_dict() for w in water_logs],
        'meal_plans': [p.to_dict() for p in meal_plans],
        'meal_scans': [s.to_dict() for s in meal_scans],
        'diary_entries': [e.to_dict() for e in diary_entries],
        'barcode_foods': [f.to_dict() for f in barcode_foods],
        'recipes': [r.to_dict() for r in recipes],
        'custom_foods': [f.to_dict() for f in custom_foods],
        'timeline': timeline[:50],
    })


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    if user.email == os.environ.get('ADMIN_EMAIL', ''):
        return jsonify({'error': 'Cannot delete the admin account.'}), 403

    email = user.email
    try:
        for model in CASCADE_MODELS:
            model.query.filter_by(email=email).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': f'User {user.name} ({email}) and all associated data deleted.'})
    except Exception as e:
        db.session.rollback()
        print(f'Delete user failed: {e}')
        return jsonify({'error': 'Failed to delete user.'}), 500


@admin_bp.route('/users/bulk-delete', methods=['POST'])
@require_admin
def bulk_delete_users(current_user):
    data = request.get_json()
    if not data or 'user_ids' not in data:
        return jsonify({'error': 'user_ids list is required.'}), 400

    user_ids = data['user_ids']
    if not isinstance(user_ids, list) or not user_ids:
        return jsonify({'error': 'user_ids must be a non-empty list.'}), 400

    admin_email = os.environ.get('ADMIN_EMAIL', '')
    deleted = 0
    errors = []

    for uid in user_ids:
        user = User.query.get(uid)
        if not user:
            errors.append({'id': uid, 'error': 'Not found'})
            continue
        if user.email == admin_email:
            errors.append({'id': uid, 'error': 'Cannot delete admin'})
            continue
        try:
            for model in CASCADE_MODELS:
                model.query.filter_by(email=user.email).delete()
            db.session.delete(user)
            db.session.commit()
            deleted += 1
        except Exception as e:
            db.session.rollback()
            errors.append({'id': uid, 'error': str(e)})

    return jsonify({'deleted': deleted, 'errors': errors})


@admin_bp.route('/users/export', methods=['GET'])
def export_users():
    from app.auth_helper import get_current_user
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required.'}), 401
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if user['email'] != admin_email:
        return jsonify({'error': 'Admin access required.'}), 403

    users_data = User.query.order_by(User.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['ID', 'Name', 'Email', 'Created At', 'Meal Plans', 'Diary Entries', 'Scans', 'Has Onboarding'])
    for u in users_data:
        w.writerow([
            u.id, u.name, u.email, u.created_at.isoformat() if u.created_at else '',
            MealPlan.query.filter_by(email=u.email).count(),
            FoodDiaryEntry.query.filter_by(email=u.email).count(),
            MealScan.query.filter_by(email=u.email).count(),
            'Yes' if OnboardingDetail.query.filter_by(email=u.email).first() else 'No',
        ])
    return Response(output.getvalue(), mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment;filename=users.csv'})


# ── Contact Messages / Export ──────────────────────────────────────────

@admin_bp.route('/contact/export', methods=['GET'])
def export_contacts():
    from app.auth_helper import get_current_user
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required.'}), 401
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if user['email'] != admin_email:
        return jsonify({'error': 'Admin access required.'}), 403

    entries = ContactUs.query.order_by(ContactUs.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['ID', 'Name', 'Email', 'Subject', 'Message', 'Is Read', 'Created At'])
    for e in entries:
        w.writerow([e.id, e.name, e.email, e.subject, e.message, e.is_read, e.created_at.isoformat()])
    return Response(output.getvalue(), mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment;filename=contact_messages.csv'})


@admin_bp.route('/contact-messages/<int:message_id>/read', methods=['PATCH'])
@require_admin
def mark_read(current_user, message_id):
    msg = ContactUs.query.get(message_id)
    if not msg:
        return jsonify({'error': 'Message not found.'}), 404
    msg.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read.', 'entry': msg.to_dict()})


@admin_bp.route('/contact-messages/<int:message_id>/reply', methods=['POST'])
@require_admin
def reply_message(current_user, message_id):
    msg = ContactUs.query.get(message_id)
    if not msg:
        return jsonify({'error': 'Message not found.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    reply_body = (data.get('reply') or '').strip()
    if not reply_body:
        return jsonify({'errors': {'reply': 'Reply text is required.'}}), 422

    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USERNAME', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')

    mime_msg = MIMEMultipart('alternative')
    mime_msg['From'] = smtp_user
    mime_msg['To'] = msg.email
    mime_msg['Subject'] = f'Re: {msg.subject}'
    mime_msg['Date'] = formatdate(localtime=True)
    mime_msg['Message-ID'] = make_msgid(domain='nutriplanpro.com')

    text = f'''Hi {msg.name},

{reply_body}

---
NutriPlan Pro Support Team'''

    html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;padding:32px">
<div style="font-size:20px;font-weight:700;color:#0f766e;margin-bottom:16px">NutriPlan Pro</div>
<p style="font-size:14px;color:#333;line-height:1.5;margin:0 0 16px">Hi {msg.name},</p>
<p style="font-size:14px;color:#333;line-height:1.5;margin:0 0 16px">{reply_body}</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
<p style="font-size:12px;color:#94a3b8;margin:0">NutriPlan Pro Support Team</p>
</div>
</body>
</html>'''

    mime_msg.attach(MIMEText(text, 'plain'))
    mime_msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, msg.email, mime_msg.as_string())
    except Exception as e:
        print(f'Reply send failed: {e}')
        return jsonify({'error': 'Failed to send reply. Try again later.'}), 500

    msg.is_read = True
    db.session.commit()
    return jsonify({'message': 'Reply sent.', 'entry': msg.to_dict()})


# ── Content Moderation (Recipes, Custom Foods, Barcode Foods) ───────────

@admin_bp.route('/recipes', methods=['GET'])
@require_admin
def list_recipes(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    q = Recipe.query.order_by(Recipe.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        'recipes': [r.to_dict() for r in items],
        'total': total, 'page': page, 'per_page': per_page,
    })


@admin_bp.route('/recipes/<int:recipe_id>', methods=['DELETE'])
@require_admin
def delete_recipe(current_user, recipe_id):
    r = Recipe.query.get(recipe_id)
    if not r:
        return jsonify({'error': 'Recipe not found.'}), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Recipe deleted.'})


@admin_bp.route('/custom-foods', methods=['GET'])
@require_admin
def list_custom_foods(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    q = CustomFood.query.order_by(CustomFood.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        'custom_foods': [f.to_dict() for f in items],
        'total': total, 'page': page, 'per_page': per_page,
    })


@admin_bp.route('/custom-foods/<int:food_id>', methods=['DELETE'])
@require_admin
def delete_custom_food(current_user, food_id):
    f = CustomFood.query.get(food_id)
    if not f:
        return jsonify({'error': 'Food not found.'}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({'message': 'Custom food deleted.'})


@admin_bp.route('/barcode-foods', methods=['GET'])
@require_admin
def list_barcode_foods(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    q = BarcodeFood.query.order_by(BarcodeFood.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        'barcode_foods': [f.to_dict() for f in items],
        'total': total, 'page': page, 'per_page': per_page,
    })


@admin_bp.route('/barcode-foods/<int:food_id>', methods=['DELETE'])
@require_admin
def delete_barcode_food(current_user, food_id):
    f = BarcodeFood.query.get(food_id)
    if not f:
        return jsonify({'error': 'Food not found.'}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({'message': 'Barcode food deleted.'})