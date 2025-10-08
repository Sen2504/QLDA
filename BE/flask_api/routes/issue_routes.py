from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_api.services.issue_service import IssueService
from flask_api.schemas.issue_schemas import IssueSchema
from marshmallow import ValidationError

issue_bp = Blueprint("issue_bp", __name__, url_prefix="/api/issues")

issue_schema = IssueSchema()
issues_schema = IssueSchema(many=True)

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
    # Ép form-data ra dict
    data = request.form.to_dict(flat=True)

    # Lấy danh sách file (hỗ trợ cả 1 hoặc nhiều)
    files = request.files.getlist("files")
    if not files:
        single_file = request.files.get("files")
        if single_file:
            files = [single_file]

    issue, error = IssueService.create(data, files)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(issue_schema.dump(issue)), 201


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

    deleted_files = data.get("deleted_files")
    if deleted_files:
        import json
        try:
            deleted_files = json.loads(deleted_files)
        except Exception:
            deleted_files = []
    else:
        deleted_files = []

    issue, error = IssueService.update(issue_id, data, new_files=new_files, deleted_files=deleted_files)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Cập nhật issue thành công!",
        "issue": issue.id,
        "files": IssueService._list_files(issue.id)
    }), 200