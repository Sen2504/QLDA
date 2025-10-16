from marshmallow import Schema, fields
from flask_api.models.issue_models import IssueStatus, Severity, Priority
from flask_api.models.issue_resolve_models import IssueResolve
from flask_api.schemas.issue_comment_schemas import IssueCommentSchema


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

    # ---- Danh sách người xử lý ----
    handlers = fields.Method("get_handlers")

    # Nested
    project = fields.Nested(
        "flask_api.schemas.project_schemas.ProjectSchema",
        only=("id", "name", "role_name", "status"),
        dump_only=True
    )

    comments = fields.Nested(IssueCommentSchema, many=True, dump_only=True)

    # ---- METHODS ----
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

    def get_evidence_files(self, obj):
        try:
            import json
            if not obj.evidence_file:
                return []
            return json.loads(obj.evidence_file)
        except Exception:
            return []

    def get_handlers(self, obj):
        """Lấy danh sách tất cả người được phân công xử lý issue"""
        resolves = IssueResolve.query.filter_by(issue_id=obj.id).all()
        if not resolves:
            return []

        handlers = []
        for res in resolves:
            if not res.team:
                continue
            team = res.team
            user = getattr(team, "user", None)
            projrole = getattr(team, "projrole", None)
            role = getattr(projrole, "role", None)

            handlers.append({
                "team_id": team.id,
                "user_id": user.id if user else None,
                "user_email": user.email if user else None,
                "role_name": role.name if role else None,
            })

        return handlers
