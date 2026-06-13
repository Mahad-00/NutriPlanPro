from app import db
from datetime import datetime, date as date_type


class WaterLog(db.Model):
    __tablename__ = 'WaterLogs'
    __table_args__ = (
        db.Index('ix_water_logs_email_date', 'email', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    ml = db.Column(db.Integer, default=0)
    time = db.Column(db.String(20), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'ml': self.ml,
            'time': self.time,
        }
