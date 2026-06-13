from datetime import date as date_type
from flask import Blueprint, request, jsonify
from app import db
from app.models.WorkoutRoutine import WorkoutRoutine
from app.models.WorkoutLog import WorkoutLog
from app.auth_helper import require_auth

workouts_bp = Blueprint('workouts', __name__)

EXERCISES_BY_GOAL = {
    'build_muscle': ['Deadlifts 4×8', 'Bench Press 4×8', 'Rows 3×12', 'Overhead Press 3×10', 'Squats 4×8'],
    'fat_loss': ['Squats 3×15', 'Push Ups 3×12', 'Plank 3×45s', 'Burpees 3×10', 'Jump Rope 3×60s'],
    'endurance': ['Running 20 min', 'Cycling 15 min', 'Swimming 10 laps', 'Jump Rope 3×60s', 'Rowing 10 min'],
    'general_fitness': ['Squats 3×12', 'Push Ups 3×10', 'Plank 3×30s', 'Lunges 3×10', 'Stretching 10 min'],
}


@workouts_bp.route('/routines', methods=['GET'])
@require_auth
def list_routines(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = WorkoutRoutine.query.filter_by(email=current_user['email'])
    total = q.count()
    routines = q.order_by(WorkoutRoutine.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'routines': [r.to_dict() for r in routines], 'total': total, 'page': page, 'per_page': per_page})


@workouts_bp.route('/routines', methods=['POST'])
@require_auth
def create_routine(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    goal = data.get('goal', 'general_fitness')
    exercises = EXERCISES_BY_GOAL.get(goal, EXERCISES_BY_GOAL['general_fitness'])
    name = data.get('name', f'Generated {goal.replace("_", " ")} routine')
    routine = WorkoutRoutine(
        email=current_user['email'],
        name=name,
        goal=goal,
        level=data.get('level', 'beginner'),
        exercises=','.join(exercises),
    )
    db.session.add(routine)
    db.session.commit()
    return jsonify({'routine': routine.to_dict()}), 201


@workouts_bp.route('/logs', methods=['GET'])
@require_auth
def list_logs(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = WorkoutLog.query.filter_by(email=current_user['email'])
    total = q.count()
    logs = q.order_by(WorkoutLog.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'logs': [l.to_dict() for l in logs], 'total': total, 'page': page, 'per_page': per_page})


@workouts_bp.route('/logs', methods=['POST'])
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
    log = WorkoutLog(
        email=current_user['email'],
        routine_name=data.get('routine_name', ''),
        goal=data.get('goal', ''),
        date=log_date,
        exercises=data.get('exercises', ''),
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'log': log.to_dict()}), 201
