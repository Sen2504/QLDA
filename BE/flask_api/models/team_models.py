from flask_api.extensions import db

class Team(db.Model):
    __tablename__ = "team"
    id = db.Column("ID_TEAM", db.Integer, primary_key=True, autoincrement=True)
    projrole_id = db.Column("ID_PROJROLE", db.Integer, db.ForeignKey("projectrole.ID_PROJROLE"), nullable=False)
    user_id = db.Column("ID_USER", db.Integer, db.ForeignKey("users.ID_USER"), nullable=False)

    user = db.relationship("Users", back_populates="teams")
    projrole = db.relationship("ProjectRole", back_populates="teams")
    phancong = db.relationship("PhanCong", back_populates="task")

    def __repr__(self):
        return f"<Team id={self.id} user_id={self.user_id} projrole_id={self.projrole_id}>"