# file: routes/team_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_api.services.team_service import TeamService
from flask_api.schemas.team_schemas import TeamSchema

team_bp = Blueprint("team_bp", __name__, url_prefix="/api/teams")

team_schema = TeamSchema()
teams_schema = TeamSchema(many=True)

# ----------------- GET team by project -----------------
@team_bp.route("/<int:project_id>", methods=["GET"])
@login_required
def get_team(project_id):
    members = TeamService.get_team_by_project(project_id)
    return jsonify(teams_schema.dump(members)), 200

# ----------------- INVITE user to project -----------------
@team_bp.route("/invite/<int:project_id>", methods=["POST"])
@login_required
def invite_user(project_id):
    data = request.get_json() or {}
    email = data.get("email")
    role_id = data.get("role_id")

    if not email or not role_id:
        return jsonify({"error": "Email và role_id là bắt buộc."}), 400

    new_member, error = TeamService.invite_user(project_id, email, role_id)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(team_schema.dump(new_member)), 201

# ----------------- REMOVE member from project -----------------
@team_bp.route("/<int:project_id>/remove/<int:user_id>", methods=["DELETE"])
@login_required
def remove_member(project_id, user_id):
    success, error = TeamService.remove_member(project_id, user_id,current_user.id)
    if not success:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Đã xóa thành viên khỏi project."}), 200

# ----------------- GET team summary -----------------
@team_bp.route("/<int:project_id>/summary", methods=["GET"])
@login_required
def team_summary(project_id):
    data = TeamService.get_team_summary(project_id)
    return jsonify(data), 200