# file: models/action_models.py
from flask_api.extensions import db

class Action(db.Model):
    __tablename__ = "action"

    ID_act = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name_act = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<Action ID={self.ID_act} Name={self.Name_act}>"
