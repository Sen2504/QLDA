# file: flask_api/routes/team_invite_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_api.services.team_invite_service import TeamInviteService
from flask_api.services.team_service import TeamService
from flask_api.schemas.team_invite_schemas import TeamInviteSchema

team_invite_bp = Blueprint("team_invite", __name__, url_prefix="/api/team_invites")

@team_invite_bp.route("/invite", methods=["POST"])
@login_required
def invite_user():
    data = request.get_json()
    project_id = data.get("project_id")
    projrole_id = data.get("projrole_id")    
    email = data.get("email")   

    invite, error = TeamInviteService.create_invite(project_id, projrole_id, email)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(TeamInviteSchema().dump(invite)), 201


@team_invite_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def list_invites(project_id):
    invites = TeamInviteService.get_invites_by_project(project_id)
    return jsonify(TeamInviteSchema(many=True).dump(invites)), 200


@team_invite_bp.route("/project/<int:project_id>/summary", methods=["GET"])
@login_required
def project_team_summary(project_id):
    """
    Trả về cả danh sách thành viên chính thức và invite pending.
    """
    # Thành viên chính thức
    members = TeamService.get_team_by_project(project_id)

    # Lời mời pending
    invites = TeamInviteService.get_invites_by_project(project_id)
    pending = [i for i in invites if i.status == "pending"]
    pending_data = TeamInviteSchema(many=True).dump(pending)

    return jsonify({
        "members": members,
        "pending_invites": pending_data
    })


@team_invite_bp.route("/accept/<int:invite_id>", methods=["POST"])
@login_required
def accept_invite(invite_id):
    team, error = TeamInviteService.accept_invite(invite_id, current_user.id)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Đã tham gia project thành công."}), 200


@team_invite_bp.route("/reject/<int:invite_id>", methods=["POST"])
@login_required
def reject_invite(invite_id):
    success, error = TeamInviteService.reject_invite(invite_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Bạn đã từ chối lời mời."}), 200


@team_invite_bp.route("/revoke/<int:invite_id>", methods=["DELETE"])
@login_required
def revoke_invite(invite_id):
    """
    Thu hồi (xóa) lời mời chưa được chấp nhận.
    """
    success, error = TeamInviteService.revoke_invite(invite_id)
    if not success:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Lời mời đã được thu hồi."}), 200


@team_invite_bp.route("/my-invites", methods=["GET"])
@login_required
def my_invites():
    email = (current_user.email or "").strip().lower()

    invites = TeamInviteService.get_invites_for_user(email)

    return jsonify(TeamInviteSchema(many=True).dump(invites)), 200
