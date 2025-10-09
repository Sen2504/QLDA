from datetime import datetime

from flask_api.extensions import db


class TaskComment(db.Model):
    __tablename__ = "task_comment"

    id = db.Column("ID_COMMENT", db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column("ID_TASK", db.Integer, db.ForeignKey("task.ID_TASK", ondelete="CASCADE"), nullable=False)
    user_id = db.Column("ID_USER", db.Integer, db.ForeignKey("users.ID_USER"), nullable=True)
    team_id = db.Column("ID_TEAM", db.Integer, db.ForeignKey("team.ID_TEAM"), nullable=True)
    content = db.Column("CONTENT", db.Text, nullable=False)
    created_at = db.Column("CREATED_AT", db.DateTime, default=datetime.utcnow, nullable=False)

    task = db.relationship("Task", back_populates="comments")
    user = db.relationship("User", back_populates="task_comments")
    team = db.relationship("Team", back_populates="task_comments")

    def __repr__(self):
        return f"<TaskComment id={self.id} task_id={self.task_id}>"
