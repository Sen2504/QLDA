from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_api.services.permission_service import PermissionService
from flask_api.services.project_service import ProjectService
from flask_api.schemas.permission_schemas import PermissionMatrixSchema, PermissionUpdateSchema

permission_bp = Blueprint("permission", __name__, url_prefix="/api/permissions")


def _is_project_owner(user_id, project_id):
    # reuse ProjectService.change_status owner check logic pattern
    owner_projrole = (
        ProjectService.get_by_id(project_id)
    )
    # simple check: find if current user has a Team entry with Role Project Owner
    from flask_api.models import ProjectRole, Role, Team
    owner = (
        ProjectRole.query.join(Role, ProjectRole.role_id == Role.id)
        .join(Team, Team.projrole_id == ProjectRole.id)
        .filter(ProjectRole.project_id == project_id, Role.name == "Project Owner", Team.user_id == user_id)
        .first()
    )
    return bool(owner)


@permission_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def get_matrix(project_id):
    # Only project members should be able to see; editing restricted to owner
    # Verify membership: current_user must have a Team entry in this project
    from flask_api.services.permission_service import PermissionService
    if PermissionService._projrole_for_user_project(current_user.id, project_id) is None:
        return jsonify({"error": "Bạn không thuộc project này."}), 403
    matrix = PermissionService.get_matrix_for_project(project_id)
    return jsonify(PermissionMatrixSchema().dump(matrix)), 200


@permission_bp.route("/project/<int:project_id>/role/<int:projrole_id>", methods=["PUT"])
@login_required
def update_role_permissions(project_id, projrole_id):
    # Only Project Owner can update
    if not _is_project_owner(current_user.id, project_id):
        return jsonify({"error": "Bạn không có quyền cập nhật phân quyền project."}), 403

    data = request.get_json() or {}
    schema = PermissionUpdateSchema()
    validated = schema.load(data)
    updates = validated.get("updates")
    try:
        PermissionService.set_permissions_bulk(project_id, projrole_id, updates)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"message": "Cập nhật thành công."}), 200
