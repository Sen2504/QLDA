# file: routes/project_routes.py
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from flask_api.schemas.project_schemas import ProjectSchema
from flask_api.services.project_service import ProjectService

project_bp = Blueprint("project_bp", __name__, url_prefix="/api/projects")

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)

# ----------------- GET ALL -----------------
@project_bp.route("/", methods=["GET"])
def get_projects():
    projects = ProjectService.get_all()
    return jsonify(projects_schema.dump(projects)), 200

# ----------------- GET BY ID -----------------
@project_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    project = ProjectService.get_by_id(project_id)
    if not project:
        return jsonify({"error": "Không tìm thấy project."}), 404
    return jsonify(project_schema.dump(project)), 200

# ----------------- CREATE -----------------
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

# ----------------- PUT -----------------
@project_bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    data = request.get_json() or {}
    name = data.get("Name_project")
    description = data.get("Description")

    project, error = ProjectService.update(project_id, name, description)
    if error:
        status_code = 404 if error == "Không tìm thấy project." else 400
        return jsonify({"error": error}), status_code
    return jsonify(project_schema.dump(project)), 200


# ----------------- DELETE -----------------
@project_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    success, error = ProjectService.delete(project_id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Xóa project thành công."}), 200