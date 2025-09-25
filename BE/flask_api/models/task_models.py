from flask_api.extensions import db

class Task(db.Model):
    __tablename__ = "task"
    id = db.Column("ID_TASK", db.Integer, primary_key=True, autoincrement=True)
    user_story_id = db.Column("ID_USER_STORIES", db.Integer, db.ForeignKey("user_stories.ID_USER_STORIES"), nullable=False)
    status_id = db.Column("ID", db.Integer, db.ForeignKey("task_status.ID"), nullable=False)
    name = db.Column("NAME", db.String(200), nullable=False)
    description = db.Column("DESCRIPTION", db.Text, nullable=False)

    user_story = db.relationship("UserStory", back_populates="tasks")
    status = db.relationship("TaskStatus", back_populates="tasks")
    hashtags = db.relationship("TaskHashtag", back_populates="task")
    phancong = db.relationship("PhanCong", back_populates="task")

    def __repr__(self):
        return f"<Task id={self.id} name={self.name} status_id={self.status_id}>"