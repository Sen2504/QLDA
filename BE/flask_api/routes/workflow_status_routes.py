# routes/workflow_status_route.py

from flask import Blueprint, request, jsonify
from flask_api.services import workflow_status_service
from flask_api.schemas.workflow_status_schema import WorkflowStatusSchema

workflow_status_schema = WorkflowStatusSchema()
workflow_status_list_schema = WorkflowStatusSchema(many=True)
workflow_status_bp = Blueprint('workflow_status_bp', __name__, url_prefix='/api')

@workflow_status_bp.route('/workflow_status', methods=['GET'])
def get_all_statuses():
    statuses = workflow_status_service.get_all_workflow_statuses()
    return jsonify([{'ID_status': s.ID_status, 'Name': s.Name} for s in statuses])

@workflow_status_bp.route('/workflow_status/<int:status_id>', methods=['GET'])
def get_status_by_id(status_id):
    status = workflow_status_service.get_workflow_status_by_id(status_id)
    if status:
        return jsonify({'ID_status': status.ID_status, 'Name': status.Name})
    return jsonify({'error': 'Status not found'}), 404

@workflow_status_bp.route('/workflow_status', methods=['POST'])
def create_status():
    data = request.get_json()
    new_status = workflow_status_service.create_workflow_status(data)
    return jsonify({'ID_status': new_status.ID_status, 'Name': new_status.Name}), 201

@workflow_status_bp.route('/workflow_status/<int:status_id>', methods=['PUT'])
def update_status(status_id):
    data = request.get_json()
    updated_status = workflow_status_service.update_workflow_status(status_id, data)
    if updated_status:
        return jsonify({'ID_status': updated_status.ID_status, 'Name': updated_status.Name})
    return jsonify({'error': 'Status not found'}), 404

@workflow_status_bp.route('/workflow_status/<int:status_id>', methods=['DELETE'])
def delete_status(status_id):
    deleted_status = workflow_status_service.delete_workflow_status(status_id)
    if deleted_status:
        return jsonify({'message': 'Deleted successfully'})
    return jsonify({'error': 'Status not found'}), 404
