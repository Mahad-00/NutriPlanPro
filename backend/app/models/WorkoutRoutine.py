from app import db
from datetime import datetime


class WorkoutRoutine(db.Model):
    __tablename__ = 'WorkoutRoutines'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    goal = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(50), default='beginner')
    exercises = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'goal': self.goal,
            'level': self.level,
            'exercises': self.exercises,
        }
