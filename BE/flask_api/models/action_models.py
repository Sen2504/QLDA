from flask_api.extensions import db

class Action(db.Model):
    __tablename__ = "action"
    id = db.Column("ID_ACT", db.Integer, primary_key=True, autoincrement=True)
    name = db.Column("NAME_ACT", db.String(100), nullable=False)

    permissions = db.relationship("Permission", back_populates="action")

    def __repr__(self):
        return f"<Action id={self.id} name={self.name}>"