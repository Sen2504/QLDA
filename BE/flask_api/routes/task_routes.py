from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from marshmallow import ValidationError

from flask_api.schemas.task_schemas import TaskCreateSchema, TaskSchema, TaskUpdateSchema
from flask_api.services.task_service import TaskService


task_bp = Blueprint("task_bp", __name__, url_prefix="/api/tasks")


task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_create_schema = TaskCreateSchema()
task_update_schema = TaskUpdateSchema()


@task_bp.route("/", methods=["GET"])
@login_required
def list_tasks():
    tasks = TaskService.get_all()
    return jsonify(tasks_schema.dump(tasks)), 200


@task_bp.route("/my-tasks", methods=["GET"])
@login_required
def my_tasks():
    tasks = TaskService.get_by_user(current_user.id)
    return jsonify(tasks_schema.dump(tasks)), 200


@task_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def tasks_by_project(project_id):
    tasks = TaskService.get_by_project(project_id)
    return jsonify(tasks_schema.dump(tasks)), 200


@task_bp.route("/user-story/<int:user_story_id>", methods=["GET"])
@login_required
def tasks_by_user_story(user_story_id):
    tasks = TaskService.get_by_user_story(user_story_id)
    return jsonify(tasks_schema.dump(tasks)), 200


@task_bp.route("/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    task = TaskService.get_by_id(task_id)
    if not task:
        return jsonify({"error": "Khong tim thay task."}), 404
    return jsonify(task_schema.dump(task)), 200


@task_bp.route("/", methods=["POST"])
@login_required
def create_task():
    payload = request.get_json() or {}
    try:
        data = task_create_schema.load(payload)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    task, error = TaskService.create(data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(task_schema.dump(task)), 201


@task_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    payload = request.get_json() or {}
    try:
        data = task_update_schema.load(payload)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not data:
        return jsonify({"error": "Khong co truong nao de cap nhat."}), 400

    task, error = TaskService.update(task_id, data)
    if error:
        status_code = 404 if error == "Khong tim thay task." else 400
        return jsonify({"error": error}), status_code
    return jsonify(task_schema.dump(task)), 200


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    success, error = TaskService.delete(task_id)
    if not success:
        status_code = 404 if error == "Khong tim thay task." else 400
        return jsonify({"error": error}), status_code
    return jsonify({"message": "Da xoa task."}), 200
