from marshmallow import Schema, fields
from flask_api.models.issue_models import IssueStatus, Severity, Priority


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
    status = fields.Str(required=True)
    severity = fields.Str(required=True)
    priority = fields.Str(required=True)
    expire_date = fields.Date(required=True)
    evidence_file = fields.Str(allow_none=True)

    # Nested
    type = fields.Nested(
        "flask_api.schemas.issue_type_schemas.IssueTypeSchema",
        only=("id", "name"),
        dump_only=True
    )
    project = fields.Nested(
        "flask_api.schemas.project_schemas.ProjectSchema",
        only=("id", "name", "role_name", "status"),
        dump_only=True
    )
    # --- method để dump danh sách file thực tế ---
    def get_evidence_files(self, obj):
        try:
            from flask_api.services.issue_service import IssueService
            return IssueService._list_files(obj.id)
        except Exception:
            return []
