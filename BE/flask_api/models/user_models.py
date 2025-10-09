from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from flask_api.extensions import db
class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column("ID_USER", db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True)
    confirmed = db.Column(db.Boolean, default=False)
    confirmed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    skillset = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(500), nullable=True)  # URL ảnh đại diện

    teams = db.relationship("Team", back_populates="user")
    task_comments = db.relationship("TaskComment", back_populates="user")
    
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)