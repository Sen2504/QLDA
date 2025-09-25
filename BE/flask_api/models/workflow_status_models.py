# file: models/workflow_status_model.py
from flask_api.extensions import db

class WorkflowStatus(db.Model):
    __tablename__ = "workflow_status"

    ID_status = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<WorkflowStatus ID={self.ID_status} Name={self.Name}>"
