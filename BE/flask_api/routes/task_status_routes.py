from flask import Blueprint, request, jsonify
from flask_api.extensions import db
from flask_api.models.task_status_models import TaskStatus
from flask_api.schemas.task_status_schemas import TaskStatusSchema

task_status_bp = Blueprint("task_status_bp", __name__, url_prefix="/api/task_status")

task_status_schema = TaskStatusSchema()
task_statuses_schema = TaskStatusSchema(many=True)


@task_status_bp.route("/", methods=["POST"])
def create_task_status():
    data = request.get_json() or {}
    name_status = (data.get("name_status") or "").strip()

    # validate input
    if not name_status:
        return jsonify({"error": "Tên trạng thái là bắt buộc."}), 400

    # check trùng trong DB
    if TaskStatus.query.filter_by(name_status=name_status).first():
        return jsonify({"error": "Tên trạng thái đã tồn tại."}), 400

    new_status = TaskStatus(name_status=name_status)
    db.session.add(new_status)
    db.session.commit()
    return jsonify(task_status_schema.dump(new_status)), 201


@task_status_bp.route("/", methods=["GET"])
def get_task_statuses():
    statuses = TaskStatus.query.all()
    return jsonify(task_statuses_schema.dump(statuses)), 200


@task_status_bp.route("/<int:status_id>", methods=["GET"])
def get_task_status(status_id):
    status = TaskStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404
    return jsonify(task_status_schema.dump(status)), 200


@task_status_bp.route("/<int:status_id>", methods=["PUT"])
def update_task_status(status_id):
    status = TaskStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404

    data = request.get_json() or {}
    name_status = (data.get("name_status") or "").strip()

    if not name_status:
        return jsonify({"error": "Tên trạng thái là bắt buộc."}), 400

    # check trùng ngoại trừ chính nó
    if TaskStatus.query.filter(TaskStatus.name_status == name_status, TaskStatus.id != status_id).first():
        return jsonify({"error": "Tên trạng thái đã tồn tại."}), 400

    status.name_status = name_status
    db.session.commit()
    return jsonify(task_status_schema.dump(status)), 200


@task_status_bp.route("/<int:status_id>", methods=["PATCH"])
def patch_task_status(status_id):
    status = TaskStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404

    data = request.get_json() or {}
    if "name_status" in data:
        name_status = (data.get("name_status") or "").strip()
        if not name_status:
            return jsonify({"error": "Tên trạng thái là bắt buộc."}), 400

        if TaskStatus.query.filter(TaskStatus.name_status == name_status, TaskStatus.id != status_id).first():
            return jsonify({"error": "Tên trạng thái đã tồn tại."}), 400

        status.name_status = name_status

    db.session.commit()
    return jsonify(task_status_schema.dump(status)), 200


@task_status_bp.route("/<int:status_id>", methods=["DELETE"])
def delete_task_status(status_id):
    status = TaskStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404

    db.session.delete(status)
    db.session.commit()
    return jsonify({"message": "Xóa trạng thái thành công."}), 200
