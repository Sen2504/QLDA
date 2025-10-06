from flask import Blueprint, jsonify
from flask_login import login_required
from flask_api.services.issue_type_service import IssueTypeService
from flask_api.schemas.issue_type_schemas import IssueTypeSchema

issue_type_bp = Blueprint("issue_type_bp", __name__, url_prefix="/api/issue_types")

issue_type_schema = IssueTypeSchema()
issue_types_schema = IssueTypeSchema(many=True)

# ----------------- GET ALL -----------------
@issue_type_bp.route("/", methods=["GET"])
@login_required
def get_all_issue_types():
    issue_types = IssueTypeService.get_all()
    return jsonify(issue_types_schema.dump(issue_types)), 200
