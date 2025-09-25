from flask_api.extensions import db

class Permission(db.Model):
    __tablename__ = "permission_"
    id = db.Column("ID_PERM", db.Integer, primary_key=True, autoincrement=True)
    resource_id = db.Column("ID_RES", db.Integer, db.ForeignKey("resource.ID_RES"), nullable=False)
    action_id = db.Column("ID_ACT", db.Integer, db.ForeignKey("action.ID_ACT"), nullable=False)
    projrole_id = db.Column("ID_PROJROLE", db.Integer, db.ForeignKey("projectrole.ID_PROJROLE"), nullable=False)
    is_allowed = db.Column("IS_ALLOWED", db.Boolean, nullable=False)

    resource = db.relationship("Resource", back_populates="permissions")
    action = db.relationship("Action", back_populates="permissions")
    projrole = db.relationship("ProjectRole", back_populates="permissions")

    def __repr__(self):
        return f"<Permission id={self.id} projrole_id={self.projrole_id} allowed={self.is_allowed}>"