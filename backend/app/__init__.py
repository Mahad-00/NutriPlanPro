import sys
from pathlib import Path
from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

# Ensure backend/ is in sys.path so `from models.recommendation_engine` resolves
_backend_root = str(Path(__file__).resolve().parent.parent)
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

DATABASE_URL = os.environ.get('DATABASE_URL')

# Railway provides DATABASE_URL with sslmode=require, ensure SSL for non-local connections
if DATABASE_URL and 'localhost' not in DATABASE_URL and 'sslmode' not in DATABASE_URL:
    separator = '&' if '?' in DATABASE_URL else '?'
    DATABASE_URL = f'{DATABASE_URL}{separator}sslmode=require'

db = SQLAlchemy()


def create_app():
    FRONTEND_BUILD = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'build'
    HAS_REACT = (FRONTEND_BUILD / 'index.html').exists()

    if HAS_REACT:
        app = Flask(__name__, static_folder=str(FRONTEND_BUILD), static_url_path='')
    else:
        app = Flask(__name__)

    # Healthcheck — always available, even if everything else fails
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    import logging
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    log = logging.getLogger(__name__)

    @app.before_request
    def log_request():
        log.info(f"REQ: {request.method} {request.path}")

    @app.after_request
    def log_response(response):
        log.info(f"RES: {request.method} {request.path} -> {response.status_code}")
        return response

    try:
        CORS(app)

        if DATABASE_URL:
            app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
            app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'pool_size': 10,
                'max_overflow': 20,
                'pool_pre_ping': True,
                'pool_recycle': 300,
                'connect_args': {'connect_timeout': 5},
            }
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nutriplan-secret-key-change-in-prod')
        app.config['PREFERRED_URL_SCHEME'] = 'https'

        if DATABASE_URL:
            db.init_app(app)

        from app.routes.auth import auth_bp
        from app.routes.BarcodeFoods import barcode_foods_bp
        from app.routes.FoodDiary import food_diary_bp
        from app.routes.MealPlans import meal_plans_bp
        from app.routes.recipes import recipes_bp
        from app.routes.CustomFoods import custom_foods_bp
        from app.routes.GroceryList import grocery_list_bp
        from app.routes.DietRecommender import diet_recommender_bp
        from app.routes.goals import goals_bp
        from app.routes.workouts import workouts_bp
        from app.routes.water import water_bp
        from app.routes.WeeklyCalendar import weekly_calendar_bp
        from app.routes.progress import progress_bp
        from app.routes.recommendation import recommendation_bp
        from app.routes.MealScan import meal_scan_bp
        from app.routes.ContactUs import contact_bp
        from app.routes.Admin import admin_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(barcode_foods_bp, url_prefix='/api/barcode-foods')
        app.register_blueprint(food_diary_bp, url_prefix='/api/food-diary')
        app.register_blueprint(meal_plans_bp, url_prefix='/api/meal-plans')
        app.register_blueprint(recipes_bp, url_prefix='/api/recipes')
        app.register_blueprint(custom_foods_bp, url_prefix='/api/custom-foods')
        app.register_blueprint(grocery_list_bp, url_prefix='/api/grocery-list')
        app.register_blueprint(diet_recommender_bp, url_prefix='/api/diet-recommender')
        app.register_blueprint(goals_bp, url_prefix='/api/goals')
        app.register_blueprint(workouts_bp, url_prefix='/api/workouts')
        app.register_blueprint(water_bp, url_prefix='/api/water')
        app.register_blueprint(weekly_calendar_bp, url_prefix='/api/weekly-calendar')
        app.register_blueprint(progress_bp, url_prefix='/api/progress')
        app.register_blueprint(recommendation_bp, url_prefix='/api/recommendation')
        app.register_blueprint(meal_scan_bp, url_prefix='/api/meal-scan')
        app.register_blueprint(contact_bp, url_prefix='/api/contact')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')

        if DATABASE_URL:
            with app.app_context():
                from app.models.user import User
                from app.models.BarcodeFood import BarcodeFood
                from app.models.onboarding import OnboardingDetail
                from app.models.FoodDiary import FoodDiaryEntry
                from app.models.MealPlan import MealPlan
                from app.models.recipe import Recipe
                from app.models.CustomFood import CustomFood
                from app.models.GroceryItem import GroceryItem
                from app.models.DietRecommendation import DietRecommendation
                from app.models.goal import Goal
                from app.models.WorkoutRoutine import WorkoutRoutine
                from app.models.WorkoutLog import WorkoutLog
                from app.models.WaterLog import WaterLog
                from app.models.WeeklyCalendar import WeeklyCalendar
                from app.models.ProgressEntry import ProgressEntry
                from app.models.MealScan import MealScan
                from app.models.PasswordResetCode import PasswordResetCode
                from app.models.ContactUs import ContactUs
                db.create_all()

                from sqlalchemy import inspect
                inspector = inspect(db.engine)
                if 'is_read' not in [c['name'] for c in inspector.get_columns('ContactUs')]:
                    db.session.execute(db.text('ALTER TABLE "ContactUs" ADD COLUMN is_read BOOLEAN DEFAULT false'))
                    db.session.commit()

        # Serve React frontend build
        if HAS_REACT:
            @app.route('/')
            def serve_react():
                return send_from_directory(FRONTEND_BUILD, 'index.html')

            @app.route('/<path:path>')
            def serve_static_react(path):
                file_path = FRONTEND_BUILD / path
                if file_path.exists() and file_path.is_file():
                    return send_from_directory(FRONTEND_BUILD, path)
                return send_from_directory(FRONTEND_BUILD, 'index.html')
        else:
            @app.route('/', defaults={'path': ''})
            @app.route('/<path:path>')
            def serve_fallback(path):
                return jsonify({'status': 'ok', 'message': 'API server running'})

    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(f'FATAL: app initialization failed: {exc}')

    return app
