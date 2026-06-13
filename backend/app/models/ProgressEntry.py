from app import db
from datetime import datetime, date as date_type


class ProgressEntry(db.Model):
    __tablename__ = 'ProgressEntries'
    __table_args__ = (
        db.Index('ix_progress_entries_email_type', 'email', 'entry_type'),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    entry_type = db.Column(db.String(20), nullable=False)
    date = db.Column(db.Date, nullable=False)
    weight = db.Column(db.Float, nullable=True)
    waist = db.Column(db.Float, nullable=True)
    chest = db.Column(db.Float, nullable=True)
    hips = db.Column(db.Float, nullable=True)
    arms = db.Column(db.Float, nullable=True)
    thighs = db.Column(db.Float, nullable=True)
    filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'entry_type': self.entry_type,
            'date': self.date.isoformat(),
            'weight': self.weight,
            'waist': self.waist,
            'chest': self.chest,
            'hips': self.hips,
            'arms': self.arms,
            'thighs': self.thighs,
            'filename': self.filename,
        }
