# file: schemas/project_schemas.py
import re
from marshmallow import Schema, fields, validates, ValidationError
from flask_login import current_user
from flask_api.extensions import db
from flask_api.models.team_models import Team
from flask_api.models.role_models import Role
from flask_api.models.project_role_models import ProjectRole

class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    status = fields.Str(dump_only=True)   # thêm status

    role_name = fields.Method("get_role_name")  # thêm role_name

    @validates("name")
    def validate_name_project(self, value):
        if not value or not value.strip():
            raise ValidationError("Project name is required.")

        # Regex: cho phép chữ cái Unicode (cả tiếng Việt), số, khoảng trắng, dấu _
        pattern = r"^[\w\sÀ-ỹ]+$"
        if not re.match(pattern, value.strip(), flags=re.UNICODE):
            raise ValidationError(
                "Project names can only contain letters, numbers, spaces and underscore characters (_)."
            )

    def get_role_name(self, obj):
        team = (
            db.session.query(Role.name)
            .join(ProjectRole, Role.id == ProjectRole.role_id)
            .join(Team, Team.projrole_id == ProjectRole.id)
            .filter(ProjectRole.project_id == obj.id, Team.user_id == current_user.id)
            .first()
        )
        return team[0] if team else None
