from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from marshmallow import ValidationError

from flask_api.schemas.task_schemas import TaskCreateSchema, TaskSchema, TaskUpdateSchema
from flask_api.schemas.task_comment_schemas import TaskCommentSchema, TaskCommentCreateSchema
from flask_api.services.task_service import TaskService
from flask_api.services.task_comment_service import TaskCommentService


task_bp = Blueprint("task_bp", __name__, url_prefix="/api/tasks")


task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_create_schema = TaskCreateSchema()
task_update_schema = TaskUpdateSchema()
task_comment_schema = TaskCommentSchema()
task_comments_schema = TaskCommentSchema(many=True)
task_comment_create_schema = TaskCommentCreateSchema()


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


@task_bp.route("/<int:task_id>/comments", methods=["GET"])
@login_required
def list_task_comments(task_id):
    task = TaskService.get_by_id(task_id)
    if not task:
        return jsonify({"error": "Khong tim thay task."}), 404
    comments = TaskCommentService.list_by_task(task_id)
    return jsonify(task_comments_schema.dump(comments)), 200


@task_bp.route("/<int:task_id>/comments", methods=["POST"])
@login_required
def create_task_comment(task_id):
    payload = request.get_json() or {}
    try:
        data = task_comment_create_schema.load(payload)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    comment, error = TaskCommentService.create(
        task_id=task_id,
        user_id=current_user.id,
        content=data.get("content"),
        team_id=data.get("team_id"),
    )
    if error:
        if error in {"Khong tim thay task.", "Khong tim thay thanh vien team."}:
            status_code = 404
        elif error == "Thanh vien khong thuoc project cua task.":
            status_code = 400
        else:
            status_code = 400
        return jsonify({"error": error}), status_code
    return jsonify(task_comment_schema.dump(comment)), 201


@task_bp.route("/<int:task_id>/comments/<int:comment_id>", methods=["DELETE"])
@login_required
def delete_task_comment(task_id, comment_id):
    success, error = TaskCommentService.delete(task_id, comment_id, current_user.id)
    if not success:
        status_code = 404 if error in {"Khong tim thay binh luan.", "Binh luan khong thuoc task nay."} else 403
        return jsonify({"error": error}), status_code
    return jsonify({"message": "Da xoa binh luan."}), 200


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
