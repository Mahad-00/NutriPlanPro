from app import db
from datetime import datetime, date as date_type


class Goal(db.Model):
    __tablename__ = 'Goals'
    __table_args__ = (
        db.Index('ix_goals_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    calorie_goal = db.Column(db.Float, default=0)
    protein_goal = db.Column(db.Float, default=0)
    carb_goal = db.Column(db.Float, default=0)
    fat_goal = db.Column(db.Float, default=0)
    goal_type = db.Column(db.String(50), default='lose_weight')
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'calorie_goal': self.calorie_goal,
            'protein_goal': self.protein_goal,
            'carb_goal': self.carb_goal,
            'fat_goal': self.fat_goal,
            'goal_type': self.goal_type,
            'date': self.date.isoformat(),
        }
