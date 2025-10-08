from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_login import login_required
from flask_api.schemas.sprint_schemas import SprintSchema
from flask_api.services.sprint_service import SprintService

sprint_bp = Blueprint("sprint_bp", __name__, url_prefix="/api/sprints")
sprint_schema = SprintSchema()
sprints_schema = SprintSchema(many=True)

# ----------------- CREATE -----------------
@sprint_bp.route("/", methods=["POST"])
@login_required
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
    sprints = SprintService.get_by_project(project_id)
    return jsonify(sprints_schema.dump(sprints)), 200

# ----------------- ASSIGN USER STORY -----------------
@sprint_bp.route("/<int:sprint_id>/add_user_story/<int:user_story_id>", methods=["PUT"])
@login_required
def add_user_story_to_sprint(sprint_id, user_story_id):
    us, error = SprintService.add_user_story(sprint_id, user_story_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Thêm user story vào sprint thành công"}), 200

# ----------------- REMOVE USER STORY -----------------
@sprint_bp.route("/remove_user_story/<int:user_story_id>", methods=["PUT"])
@login_required
def remove_user_story_from_sprint(user_story_id):
    us, error = SprintService.remove_user_story(user_story_id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Bỏ user story khỏi sprint thành công"}), 200
