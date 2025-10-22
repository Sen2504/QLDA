from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from marshmallow import ValidationError

from flask_api.services.issue_service import IssueService
from flask_api.services.issue_comment_service import IssueCommentService
from flask_api.schemas.issue_schemas import IssueSchema
from flask_api.schemas.issue_comment_schemas import (
    IssueCommentSchema,
    IssueCommentCreateSchema,
)

issue_bp = Blueprint("issue_bp", __name__, url_prefix="/api/issues")

# ----- Schemas -----
issue_schema = IssueSchema()
issues_schema = IssueSchema(many=True)
issue_comment_schema = IssueCommentSchema()
issue_comments_schema = IssueCommentSchema(many=True)
issue_comment_create_schema = IssueCommentCreateSchema()

# ============================================================
#                     ISSUE CRUD
# ============================================================

# ----------------- GET ENUMS -----------------
@issue_bp.route("/enums", methods=["GET"])
@login_required
def get_issue_enums():
    enums = IssueService.get_enums()
    return jsonify(enums), 200


# ----------------- GET ALL -----------------
@issue_bp.route("/", methods=["GET"])
@login_required
def get_all_issues():
    issues = IssueService.get_all()
    return jsonify(issues_schema.dump(issues)), 200


# ----------------- GET ISSUE BY PROJECT -----------------
@issue_bp.route("/project/<int:project_id>", methods=["GET"])
@login_required
def get_issues_by_project(project_id):
    issues = IssueService.get_issue_by_project(project_id)
    return jsonify(issues_schema.dump(issues)), 200


# ----------------- GET BY ID -----------------
@issue_bp.route("/<int:issue_id>", methods=["GET"])
@login_required
def get_issue(issue_id):
    issue = IssueService.get_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Không tìm thấy Issue."}), 404

    return jsonify(issue_schema.dump(issue)), 200


# ----------------- CREATE -----------------
@issue_bp.route("/", methods=["POST"])
@login_required
def create_issue():
    data = request.form.to_dict(flat=True)

    # Lấy danh sách file
    files = request.files.getlist("files")
    if not files:
        single_file = request.files.get("files")
        if single_file:
            files = [single_file]

    issue, message = IssueService.create(data, files)

    if not issue:  # nếu không tạo được issue
        return jsonify({"error": message}), 400

    # Thành công → trả đúng status code 201
    return jsonify({
        "message": message,
        "data": issue_schema.dump(issue)
    }), 201


# ----------------- UPDATE ISSUE -----------------
@issue_bp.route("/<int:issue_id>", methods=["PUT"])
@login_required
def update_issue(issue_id):
    data = request.form.to_dict(flat=True)

    # Lấy file mới (có thể nhiều)
    new_files = request.files.getlist("files")
    if not new_files:
        single_file = request.files.get("files")
        if single_file:
            new_files = [single_file]

    # Danh sách file cần xóa
    deleted_files = data.get("deleted_files")
    if deleted_files:
        import json
        try:
            deleted_files = json.loads(deleted_files)
        except Exception:
            deleted_files = []
    else:
        deleted_files = []

    issue, error = IssueService.update(
        issue_id,
        data,
        new_files=new_files,
        deleted_files=deleted_files,
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Update status successfully!",
        "issue": issue.id,
        "files": IssueService._list_files(issue.id)
    }), 200


# ============================================================
#                     ISSUE COMMENTS
# ============================================================

# ----------------- LIST COMMENTS -----------------
@issue_bp.route("/<int:issue_id>/comments", methods=["GET"])
@login_required
def list_issue_comments(issue_id):
    issue = IssueService.get_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Không tìm thấy issue."}), 404
    comments = IssueCommentService.list_by_issue(issue_id)
    return jsonify(issue_comments_schema.dump(comments)), 200


# ----------------- CREATE COMMENT -----------------
@issue_bp.route("/<int:issue_id>/comments", methods=["POST"])
@login_required
def create_issue_comment(issue_id):
    payload = request.get_json() or {}
    try:
        data = issue_comment_create_schema.load(payload)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    comment, error = IssueCommentService.create(
        issue_id=issue_id,
        user_id=current_user.id,
        content=data.get("content"),
        team_id=data.get("team_id"),
    )

    if error:
        if error in {"Không tìm thấy issue.", "Không tìm thấy thành viên team."}:
            status_code = 404
        elif error == "Thành viên không thuộc project của issue.":
            status_code = 400
        else:
            status_code = 400
        return jsonify({"error": error}), status_code

    return jsonify(issue_comment_schema.dump(comment)), 201


# ----------------- DELETE COMMENT -----------------
@issue_bp.route("/<int:issue_id>/comments/<int:comment_id>", methods=["DELETE"])
@login_required
def delete_issue_comment(issue_id, comment_id):
    success, error = IssueCommentService.delete(
        issue_id, comment_id, current_user.id
    )
    if not success:
        status_code = (
            404
            if error in {"Không tìm thấy bình luận.", "Bình luận không thuộc issue này."}
            else 403
        )
        return jsonify({"error": error}), status_code

    return jsonify({"message": "Đã xóa bình luận."}), 200
