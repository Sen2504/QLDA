from flask_api.extensions import db

class PhanCong(db.Model):
    __tablename__ = "phan_cong"

    team_id = db.Column(db.Integer, db.ForeignKey("team.ID_TEAM"), primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("task.ID_TASK"), primary_key=True)

    
    team = db.relationship("Team", back_populates="phan_cong")
    task = db.relationship("Task", back_populates="phan_cong")

    def __repr__(self):
        return f"<PhanCong team_id={self.team_id} task_id={self.task_id}>"
