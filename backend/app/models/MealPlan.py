from app import db
from datetime import datetime, date as date_type


class MealPlan(db.Model):
    __tablename__ = 'MealPlans'
    __table_args__ = (
        db.Index('ix_meal_plans_email_active', 'email', 'is_active'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    starts_on = db.Column(db.Date, nullable=False)
    ends_on = db.Column(db.Date, nullable=False)
    duration_days = db.Column(db.Integer, default=7)
    calorie_target = db.Column(db.Integer, default=0)
    protein_target = db.Column(db.Integer, default=0)
    carb_target = db.Column(db.Integer, default=0)
    fat_target = db.Column(db.Integer, default=0)
    fiber_target = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='generated')
    is_active = db.Column(db.Boolean, default=False)
    dietary_preference = db.Column(db.String(50), default='balanced')
    goal_type = db.Column(db.String(50), default='lose_weight')
    items_count = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'starts_on': self.starts_on.isoformat(),
            'ends_on': self.ends_on.isoformat(),
            'duration_days': self.duration_days,
            'calorie_target': self.calorie_target,
            'protein_target': self.protein_target,
            'carb_target': self.carb_target,
            'fat_target': self.fat_target,
            'fiber_target': self.fiber_target,
            'status': self.status,
            'is_active': self.is_active,
            'dietary_preference': self.dietary_preference,
            'goal_type': self.goal_type,
            'items_count': self.items_count,
            'notes': self.notes,
        }
