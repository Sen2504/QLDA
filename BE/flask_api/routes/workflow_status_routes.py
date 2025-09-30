from flask import Blueprint, request, jsonify
from flask_api.extensions import db
from flask_api.models.workflow_status_models import WorkflowStatus
from flask_api.schemas.workflow_status_schema import WorkflowStatusSchema

workflow_status_bp = Blueprint("workflow_status_bp", __name__, url_prefix="/api/workflow_status")

status_schema = WorkflowStatusSchema()
statuses_schema = WorkflowStatusSchema(many=True)

# ----------------- CREATE -----------------
@workflow_status_bp.route("/", methods=["POST"])
def create_status():
    data = request.get_json() or {}
    try:
        validated = status_schema.load(data)  # validate với schema
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    new_status = WorkflowStatus(name=validated["name"])
    db.session.add(new_status)
    db.session.commit()

    return jsonify(status_schema.dump(new_status)), 201


# ----------------- GET ALL -----------------
@workflow_status_bp.route("/", methods=["GET"])
def get_all_statuses():
    statuses = WorkflowStatus.query.all()
    return jsonify(statuses_schema.dump(statuses)), 200


# ----------------- GET BY ID -----------------
@workflow_status_bp.route("/<int:status_id>", methods=["GET"])
def get_status(status_id):
    status = WorkflowStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404
    return jsonify(status_schema.dump(status)), 200


# ----------------- UPDATE -----------------
@workflow_status_bp.route("/<int:status_id>", methods=["PUT"])
def update_status(status_id):
    status = WorkflowStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404

    data = request.get_json() or {}
    try:
        validated = status_schema.load(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    status.name = validated["name"]
    db.session.commit()

    return jsonify(status_schema.dump(status)), 200


# ----------------- DELETE -----------------
@workflow_status_bp.route("/<int:status_id>", methods=["DELETE"])
def delete_status(status_id):
    status = WorkflowStatus.query.get(status_id)
    if not status:
        return jsonify({"error": "Không tìm thấy trạng thái."}), 404

    db.session.delete(status)
    db.session.commit()

    return jsonify({"message": "Xóa trạng thái thành công."}), 200
