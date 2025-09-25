from flask_api.extensions import db

class TaskHashtag(db.Model):
    __tablename__ = "task_hashtag"
    hashtag_id = db.Column("ID_HASTAG", db.Integer, db.ForeignKey("hashtag.ID_HASTAG"), primary_key=True)
    task_id = db.Column("ID_TASK", db.Integer, db.ForeignKey("task.ID_TASK"), primary_key=True)

    hashtag = db.relationship("Hashtag", back_populates="tasks")
    task = db.relationship("Task", back_populates="hashtags")

    def __repr__(self):
        return f"<TaskHashtag task_id={self.task_id} hashtag_id={self.hashtag_id}>"