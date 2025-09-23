# file: routes/action_routes.py
from flask import Blueprint, request, jsonify
from flask_api.schemas.action_schemas import ActionSchema
from flask_api.services.action_service import ActionService

action_bp = Blueprint("action_bp", __name__, url_prefix="/api/actions")

action_schema = ActionSchema()
actions_schema = ActionSchema(many=True)


@action_bp.route("/", methods=["POST"])
def create_action():
    data = request.get_json() or {}
    name_act = data.get("Name_act")

    new_action, error = ActionService.create(name_act)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(action_schema.dump(new_action)), 201


@action_bp.route("/", methods=["GET"])
def get_actions():
    actions = ActionService.get_all()
    return jsonify(actions_schema.dump(actions)), 200


@action_bp.route("/<int:action_id>", methods=["GET"])
def get_action(action_id):
    action = ActionService.get_by_id(action_id)
    if not action:
        return jsonify({"error": "Không tìm thấy hành động."}), 404
    return jsonify(action_schema.dump(action)), 200


@action_bp.route("/<int:action_id>", methods=["PUT"])
def update_action(action_id):
    data = request.get_json() or {}
    name_act = data.get("Name_act")

    action, error = ActionService.update(action_id, name_act)
    if error:
        status_code = 404 if error == "Không tìm thấy hành động." else 400
        return jsonify({"error": error}), status_code
    return jsonify(action_schema.dump(action)), 200


@action_bp.route("/<int:action_id>", methods=["PATCH"])
def patch_action(action_id):
    data = request.get_json() or {}

    action, error = ActionService.patch(action_id, data)
    if error:
        status_code = 404 if error == "Không tìm thấy hành động." else 400
        return jsonify({"error": error}), status_code
    return jsonify(action_schema.dump(action)), 200


@action_bp.route("/<int:action_id>", methods=["DELETE"])
def delete_action(action_id):
    success, error = ActionService.delete(action_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa hành động thành công."}), 200
