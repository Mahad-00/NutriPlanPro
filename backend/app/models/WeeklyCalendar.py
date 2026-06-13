from app import db
from datetime import datetime, date as date_type


class WeeklyCalendar(db.Model):
    __tablename__ = 'WeeklyCalendar'
    __table_args__ = (
        db.Index('ix_weekly_calendar_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(50), default='meal')
    name = db.Column(db.String(255), nullable=False)
    calories = db.Column(db.Integer, default=0)
    protein = db.Column(db.Integer, default=0)
    carbs = db.Column(db.Integer, default=0)
    fat = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'meal_type': self.meal_type,
            'name': self.name,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
        }
