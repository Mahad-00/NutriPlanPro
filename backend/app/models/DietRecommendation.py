from app import db
from datetime import datetime, date as date_type


class DietRecommendation(db.Model):
    __tablename__ = 'DietRecommendations'
    __table_args__ = (
        db.Index('ix_diet_recommendations_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(255), default='')
    fit_score = db.Column(db.Integer, default=0)
    kcal = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    fiber = db.Column(db.Float, default=0)
    meal_type = db.Column(db.String(50), default='')
    date = db.Column(db.Date, nullable=False)
    action_taken = db.Column(db.String(50), default='added')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'fit_score': self.fit_score,
            'kcal': self.kcal,
            'protein': self.protein,
            'carbs': self.carbs,
            'fiber': self.fiber,
            'meal_type': self.meal_type,
            'date': self.date.isoformat(),
            'action_taken': self.action_taken,
        }
