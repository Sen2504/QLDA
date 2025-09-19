# models/task_model.py
from flask_api.extensions import db

class TaskStatus(db.Model):
    __tablename__ = 'task_status'
    id = db.Column(db.Integer, primary_key=True)
    name_status = db.Column(db.String(50), nullable=False)

class Task(db.Model):
    __tablename__ = 'task'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status_id = db.Column(db.Integer, db.ForeignKey('task_status.id'))

    # Quan hệ 1 task có 1 status
    status = db.relationship('TaskStatus', backref=db.backref('tasks', lazy=True))
