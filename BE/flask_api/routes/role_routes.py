# file: routes/role_routes.py
from flask import Blueprint, request, jsonify
from flask_api.schemas.role_schemas import RoleSchema
from flask_api.services.role_service import RoleService

role_bp = Blueprint("role_bp", __name__, url_prefix="/api/roles")

role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)


@role_bp.route("/", methods=["POST"])
def create_role():
    data = request.get_json() or {}
    name_role = data.get("Name_role")

    new_role, error = RoleService.create(name_role)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(role_schema.dump(new_role)), 201


@role_bp.route("/", methods=["GET"])
def get_roles():
    roles = RoleService.get_all()
    return jsonify(roles_schema.dump(roles)), 200


@role_bp.route("/<int:role_id>", methods=["GET"])
def get_role(role_id):
    role = RoleService.get_by_id(role_id)
    if not role:
        return jsonify({"error": "Không tìm thấy role."}), 404
    return jsonify(role_schema.dump(role)), 200


@role_bp.route("/<int:role_id>", methods=["PUT"])
def update_role(role_id):
    data = request.get_json() or {}
    name_role = data.get("Name_role")

    role, error = RoleService.update(role_id, name_role)
    if error:
        status_code = 404 if error == "Không tìm thấy role." else 400
        return jsonify({"error": error}), status_code
    return jsonify(role_schema.dump(role)), 200


@role_bp.route("/<int:role_id>", methods=["DELETE"])
def delete_role(role_id):
    success, error = RoleService.delete(role_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa role thành công."}), 200
