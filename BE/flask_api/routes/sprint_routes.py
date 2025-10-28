from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_login import login_required
from flask_api.schemas.sprint_schemas import SprintSchema
from flask_api.services.sprint_service import SprintService
from flask_api.utils.permissions import (
    require_permission,
    get_project_id_from_sprint,
    get_project_id_from_user_story,
)

sprint_bp = Blueprint("sprint_bp", __name__, url_prefix="/api/sprints")
sprint_schema = SprintSchema()
sprints_schema = SprintSchema(many=True)

# ----------------- CREATE -----------------
@sprint_bp.route("/", methods=["POST"])
@login_required
@require_permission("Sprint", "Create")
def create_sprint():
    try:
        data = sprint_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    sprint, error = SprintService.create(data)
    if error:
        return jsonify({"error": error}), 400
    return jsonify(sprint_schema.dump(sprint)), 201

# ----------------- GET BY PROJECT -----------------
@sprint_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def get_sprints_by_project(project_id):
    # Allow project members to load sprints (used widely by Sidebar), permission not strictly required for listing.
    from flask_api.services.permission_service import PermissionService
    from flask_login import current_user
    if PermissionService._projrole_for_user_project(current_user.id, project_id) is None:
        return jsonify({"error": "Bạn không thuộc project này."}), 403
    sprints = SprintService.get_by_project(project_id)
    return jsonify(sprints_schema.dump(sprints)), 200

# Permissioned variant for dashboard views
@sprint_bp.route("/project/<int:project_id>/view", methods=["GET"])
@login_required
@require_permission("Sprint", "View", project_id_getter=lambda project_id: project_id)
def get_sprints_by_project_view(project_id):
    sprints = SprintService.get_by_project(project_id)
    return jsonify(sprints_schema.dump(sprints)), 200

# ----------------- ASSIGN USER STORY -----------------
@sprint_bp.route("/<int:sprint_id>/add_user_story/<int:user_story_id>", methods=["PUT"])
@login_required
@require_permission("Sprint", "Edit", project_id_getter=lambda sprint_id, user_story_id: get_project_id_from_sprint(sprint_id))
def add_user_story_to_sprint(sprint_id, user_story_id):
    us, error = SprintService.add_user_story(sprint_id, user_story_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Thêm user story vào sprint thành công"}), 200

# ----------------- REMOVE USER STORY -----------------
@sprint_bp.route("/remove_user_story/<int:user_story_id>", methods=["PUT"])
@login_required
@require_permission("Sprint", "Edit", project_id_getter=lambda user_story_id: get_project_id_from_user_story(user_story_id))
def remove_user_story_from_sprint(user_story_id):
    us, error = SprintService.remove_user_story(user_story_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Bỏ user story khỏi sprint thành công"}), 200

# ----------------- DELETE SPRINT -----------------
@sprint_bp.route("/<int:sprint_id>", methods=["DELETE"])
@login_required
@require_permission("Sprint", "Delete", project_id_getter=lambda sprint_id: get_project_id_from_sprint(sprint_id))
def delete_sprint(sprint_id):
    error = SprintService.delete(sprint_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Sprint deleted successfully"}), 200

