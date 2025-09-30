# file: flask_api/schemas/team_invite_schemas.py
from marshmallow import Schema, fields, validate

class TeamInviteSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    role_id = fields.Int(required=True)
    email = fields.Email(required=True)
    status = fields.Str(
        dump_only=True,
        validate=validate.OneOf(["pending", "accepted", "rejected"])
    )
    created_at = fields.DateTime(dump_only=True)
