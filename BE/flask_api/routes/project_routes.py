# file: routes/project_routes.py
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from flask_api.schemas.project_schemas import ProjectSchema
from flask_api.services.project_service import ProjectService

project_bp = Blueprint("project_bp", __name__, url_prefix="/api/projects")

project_schema = ProjectSchema()

@project_bp.route("/create", methods=["POST"])
@login_required
def create_project():
    data = request.get_json() or {}
    name_project = data.get("name_project")
    description = data.get("description")

    # current_user.id sẽ lấy ID user đang login
    new_project, error = ProjectService.create(
        name_project, description, current_user.id
    )

    if error:
        return jsonify({"error": error}), 400
    return jsonify(project_schema.dump(new_project)), 201
