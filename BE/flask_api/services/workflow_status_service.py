# services/workflow_status_service.py

from flask_api.extensions import db
from flask_api.models.workflow_status_models import WorkflowStatus

def get_all_workflow_statuses():
    return WorkflowStatus.query.all()

def get_workflow_status_by_id(status_id):
    return WorkflowStatus.query.get(status_id)

def create_workflow_status(data):
    new_status = WorkflowStatus(name=data['name'])
    db.session.add(new_status)
    db.session.commit()
    return new_status

def update_workflow_status(status_id, data):
    status = WorkflowStatus.query.get(status_id)
    if status:
        status.Name = data.get('Name', status.Name)
        db.session.commit()
    return status

def delete_workflow_status(status_id):
    status = WorkflowStatus.query.get(status_id)
    if status:
        db.session.delete(status)
        db.session.commit()
    return status
