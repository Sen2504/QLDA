from flask_api.extensions import db

class TaskStatus(db.Model):
    __tablename__ = 'task_status'
    
    id = db.Column(db.Integer, primary_key=True)
    name_status = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<Name_status id={self.id} name_status={self.name_status}>"