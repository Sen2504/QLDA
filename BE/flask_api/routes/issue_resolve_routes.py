from flask import Blueprint, jsonify, request
from flask_login import login_required
from flask_api.services.issue_resolve_service import IssueResolveService
from flask_api.schemas.issue_resolve_schemas import IssueResolveSchema

issue_resolve_bp = Blueprint("issue_resolve_bp", __name__, url_prefix="/api/issue_resolve")

issue_resolve_schema = IssueResolveSchema()
issue_resolves_schema = IssueResolveSchema(many=True)

# ----------------- GET ALL -----------------
@issue_resolve_bp.route("/", methods=["GET"])
@login_required
def get_all_issue_resolves():
    resolves = IssueResolveService.get_all()
    return jsonify(issue_resolves_schema.dump(resolves)), 200
