from marshmallow import Schema, fields
from flask_api.models.issue_models import IssueStatus, Severity, Priority
from flask_api.models.issue_resolve_models import IssueResolve

class IssueTypeSchema(Schema):
    id = fields.Int()
    name = fields.Str()


class ProjectSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    description = fields.Str()
    created_at = fields.DateTime()
    owner_id = fields.Int()

class IssueSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    type_id = fields.Int(required=True)
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    hashtag = fields.Str()
    status = fields.Method("get_status")
    severity = fields.Method("get_severity")
    priority = fields.Method("get_priority")
    expire_date = fields.Date(required=True)
    evidence_file = fields.Method("get_evidence_files", dump_only=True)

    assignee = fields.Method("get_assignee")

    def get_assignee(self, obj):
        """Lấy thông tin người đang xử lý issue từ bảng issue_resolve"""
        resolve = IssueResolve.query.filter_by(issue_id=obj.id).first()
        if not resolve or not resolve.team:
            return None

        team = resolve.team
        user = team.user
        proj_role = team.projrole
        role = proj_role.role if proj_role else None

        return {
            "team_id": team.id,
            "user_id": user.id if user else None,
            "user_email": user.email if user else None,
            "role_name": role.name if role else None,
        }

    # Nested
    # type = fields.Nested(
    #     "flask_api.schemas.issue_type_schemas.IssueTypeSchema",
    #     only=("id", "name"),
    #     dump_only=True
    # )

    project = fields.Nested(
        "flask_api.schemas.project_schemas.ProjectSchema",
        only=("id", "name", "role_name", "status"),
        dump_only=True
    )

    def get_status(self, obj):
        try:
            return obj.status.value if obj.status else None
        except AttributeError:
            return str(obj.status)  # fallback nếu status là chuỗi

    def get_severity(self, obj):
        try:
            return obj.severity.value if obj.severity else None
        except AttributeError:
            return str(obj.severity)

    def get_priority(self, obj):
        try:
            return obj.priority.value if obj.priority else None
        except AttributeError:
            return str(obj.priority)


    def get_hashtag(self, obj):
        try:
            import json
            return json.loads(obj.hashtag) if obj.hashtag else []
        except Exception:
            return []
        
    # --- method để dump danh sách file thực tế ---
    def get_evidence_files(self, obj):
        try:
            import json
            if not obj.evidence_file:
                return []
            return json.loads(obj.evidence_file)
        except Exception:
            return []
