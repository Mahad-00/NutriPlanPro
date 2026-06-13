from app import db
from datetime import datetime, date as date_type


class WorkoutLog(db.Model):
    __tablename__ = 'WorkoutLogs'
    __table_args__ = (
        db.Index('ix_workout_logs_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    routine_name = db.Column(db.String(255), default='')
    goal = db.Column(db.String(50), default='')
    date = db.Column(db.Date, nullable=False)
    exercises = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'routine_name': self.routine_name,
            'goal': self.goal,
            'date': self.date.isoformat(),
            'exercises': self.exercises,
        }
