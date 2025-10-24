# file: flask_api/schemas/team_invite_schemas.py
from marshmallow import Schema, fields, validate

class TeamInviteSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    projrole_id = fields.Int()
    email = fields.Email(required=True)
    status = fields.Str(
        dump_only=True,
        validate=validate.OneOf(["pending", "accepted", "rejected"])
    )
    created_at = fields.DateTime(dump_only=True)
    role_name = fields.Function(lambda obj: obj.projrole.name if obj.projrole else None)
    project_name = fields.Method("get_project_name")
    user_name = fields.Method("get_user_name")

    def get_role_name(self, obj):
        return obj.role.name if obj.role else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None
    
    def get_user_name(self, obj):
        """Lấy tên user nếu email đã đăng ký trong hệ thống"""
        from flask_api.models.user_models import User
        user = User.query.filter_by(email=obj.email).first()
        return user.name if user else None