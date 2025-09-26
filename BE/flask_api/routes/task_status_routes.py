# file: routes/task_status_route.py
from flask import Blueprint, request, jsonify
from flask_api.schemas.task_status_schemas import TaskStatusSchema
from flask_api.services.task_status_service import TaskStatusService

task_status_bp = Blueprint("task_status_bp", __name__, url_prefix="/api/task_status")

task_status_schema = TaskStatusSchema()
task_statuses_schema = TaskStatusSchema(many=True)


@task_status_bp.route("/", methods=["POST"])
def create_task_status():
    data = request.get_json() or {}
    name_status = data.get("name_status")

    new_status, error = TaskStatusService.create(name_status)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(task_status_schema.dump(new_status)), 201


@task_status_bp.route("/", methods=["GET"])
def get_task_statuses():
    statuses = TaskStatusService.get_all()
    return jsonify(task_statuses_schema.dump(statuses)), 200


@task_status_bp.route("/<int:status_id>", methods=["GET"])
def get_task_status(status_id):
    status = TaskStatusService.get_by_id(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404
    return jsonify(task_status_schema.dump(status)), 200


@task_status_bp.route("/<int:status_id>", methods=["PUT"])
def update_task_status(status_id):
    data = request.get_json() or {}
    name_status = data.get("name_status")

    status, error = TaskStatusService.update(status_id, name_status)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(task_status_schema.dump(status)), 200


@task_status_bp.route("/<int:status_id>", methods=["DELETE"])
def delete_task_status(status_id):
    success, error = TaskStatusService.delete(status_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa trạng thái thành công."}), 200
