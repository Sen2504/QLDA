from flask_api.extensions import db

class UserStory(db.Model):
    __tablename__ = "user_stories"
    id = db.Column("ID_USER_STORIES", db.Integer, primary_key=True, autoincrement=True)
    status_id = db.Column("ID_STATUS", db.Integer, db.ForeignKey("workflow_status.ID_STATUS"), nullable=False)
    project_id = db.Column("ID_PROJECT", db.Integer, db.ForeignKey("project.ID_PROJECT"), nullable=False)
    sprint_id = db.Column("ID_SPRINT", db.Integer, db.ForeignKey("sprints.ID_SPRINT"), nullable=True)
    name = db.Column("NAME_STORIES", db.String(200), nullable=False)
    description = db.Column("DESCRIPTION", db.Text, nullable=False)
    expire_date = db.Column("EXPIRE_DATE", db.Date, nullable=False)
    evidence_file = db.Column("EVIDENCE_FILE", db.String(200), nullable=False)

    status = db.relationship("WorkflowStatus", back_populates="user_stories")
    project = db.relationship("Project", back_populates="user_stories")
    sprint = db.relationship("Sprint", back_populates="user_stories")
    complexity_points = db.relationship("ComplexityPoint", back_populates="user_story")
    tasks = db.relationship("Task", back_populates="user_story")
    hashtags = db.relationship("UserStoryHashtag", back_populates="user_story")

    def __repr__(self):
        return f"<UserStory id={self.id} name={self.name}>"