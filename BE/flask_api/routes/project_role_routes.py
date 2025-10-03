# file: routes/project_role_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required
from flask_api.services.project_role_service import ProjectRoleService
from flask_api.schemas.project_role_schemas import ProjectRoleSchema

project_role_bp = Blueprint("project_role_bp", __name__, url_prefix="/api/project_roles")

project_role_schema = ProjectRoleSchema()
project_roles_schema = ProjectRoleSchema(many=True)

# ----------------- GET ALL -----------------
@project_role_bp.route("/", methods=["GET"])
@login_required
def get_all_project_roles():
    proj_roles = ProjectRoleService.get_all()
    return jsonify(project_roles_schema.dump(proj_roles)), 200

# ----------------- GET BY ID -----------------
@project_role_bp.route("/<int:projrole_id>", methods=["GET"])
@login_required
def get_project_role(projrole_id):
    proj_role = ProjectRoleService.get_by_id(projrole_id)
    if not proj_role:
        return jsonify({"error": "Không tìm thấy ProjectRole."}), 404
    return jsonify(project_role_schema.dump(proj_role)), 200

# ----------------- GET BY PROJECT -----------------
@project_role_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def get_project_roles_by_project(project_id):
    proj_roles = ProjectRoleService.get_by_project(project_id)
    return jsonify(project_roles_schema.dump(proj_roles)), 200

# ----------------- CREATE -----------------
@project_role_bp.route("/", methods=["POST"])
@login_required
def create_project_role():
    data = request.get_json() or {}
    project_id = data.get("project_id")
    role_id = data.get("role_id")

    if not project_id or not role_id:
        return jsonify({"error": "project_id và role_id là bắt buộc."}), 400

    proj_role, error = ProjectRoleService.create(project_id, role_id)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(project_role_schema.dump(proj_role)), 201

# ----------------- DELETE -----------------
@project_role_bp.route("/<int:projrole_id>", methods=["DELETE"])
@login_required
def delete_project_role(projrole_id):
    success, error = ProjectRoleService.delete(projrole_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Đã xóa ProjectRole."}), 200

# ----------------- CREATE CUSTOM ROLE -----------------
@project_role_bp.route("/custom", methods=["POST"])
@login_required
def create_custom_role():
    data = request.get_json() or {}
    project_id = data.get("project_id")
    name_role = data.get("name_role")

    proj_role, error = ProjectRoleService.create_custom(project_id, name_role)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(ProjectRoleSchema().dump(proj_role)), 201

