from flask_api.extensions import db

class TaskStatus(db.Model):
    __tablename__ = "task_status"
    id = db.Column("ID", db.Integer, primary_key=True, autoincrement=True)
    name_status = db.Column("NAME_STATUS", db.String(100), nullable=False)

    tasks = db.relationship("Task", back_populates="status")

    def __repr__(self):
        return f"<TaskStatus id={self.id} name_status={self.name_status}>"