# file: flask_api/routes/team_invite_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_api.services.team_invite_service import TeamInviteService
from flask_api.schemas.team_invite_schemas import TeamInviteSchema

team_invite_bp = Blueprint("team_invite", __name__, url_prefix="/api/team_invites")

@team_invite_bp.route("/invite", methods=["POST"])
@login_required
def invite_user():
    data = request.get_json()
    project_id = data.get("project_id")
    role_id = data.get("role_id")
    email = data.get("email")

    invite, error = TeamInviteService.create_invite(project_id, role_id, email)
    if error:
        return jsonify({"error": error}), 400

    return TeamInviteSchema().jsonify(invite), 201


@team_invite_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def list_invites(project_id):
    invites = TeamInviteService.get_invites_by_project(project_id)
    return TeamInviteSchema(many=True).jsonify(invites)


@team_invite_bp.route("/accept/<int:invite_id>", methods=["POST"])
@login_required
def accept_invite(invite_id):
    team, error = TeamInviteService.accept_invite(invite_id, current_user.id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Đã tham gia project thành công."})


@team_invite_bp.route("/reject/<int:invite_id>", methods=["POST"])
@login_required
def reject_invite(invite_id):
    success, error = TeamInviteService.reject_invite(invite_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Bạn đã từ chối lời mời."})
