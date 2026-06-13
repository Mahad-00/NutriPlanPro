from app import db
from datetime import datetime


class OnboardingDetail(db.Model):
    __tablename__ = 'OnboardingDetails'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True)

    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(50), nullable=False)
    height_cm = db.Column(db.Float, nullable=False)
    current_weight_kg = db.Column(db.Float, nullable=False)
    target_weight_kg = db.Column(db.Float, nullable=False)
    goal_type = db.Column(db.String(50), nullable=False)
    activity_level = db.Column(db.String(50), nullable=False)
    dietary_preference = db.Column(db.String(50), nullable=False)
    allergies = db.Column(db.Text, default='')
    disliked_foods = db.Column(db.Text, default='')
    preferred_cuisines = db.Column(db.Text, default='')
    meals_per_day = db.Column(db.Integer, default=3)
    budget_level = db.Column(db.String(20), default='medium')
    cooking_time_preference = db.Column(db.String(20), default='moderate')
    medical_notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'age': self.age,
            'gender': self.gender,
            'height_cm': self.height_cm,
            'current_weight_kg': self.current_weight_kg,
            'target_weight_kg': self.target_weight_kg,
            'goal_type': self.goal_type,
            'activity_level': self.activity_level,
            'dietary_preference': self.dietary_preference,
            'meals_per_day': self.meals_per_day,
        }
