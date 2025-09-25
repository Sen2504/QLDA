from flask_api.extensions import db

class WorkflowStatus(db.Model):
    __tablename__ = "workflow_status"
    id = db.Column("ID_STATUS", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME", db.String(100), nullable=False)

    user_stories = db.relationship("UserStory", back_populates="status")

    def __repr__(self):
        return f"<WorkflowStatus id={self.id} name={self.name}>"