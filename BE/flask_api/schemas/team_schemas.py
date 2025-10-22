# file: schemas/team_schemas.py
from marshmallow import Schema, fields

class TeamSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    projrole_id = fields.Int(required=True)
    user_email = fields.Str()
    role_name = fields.Str()
    # nested để trả thêm thông tin user & role
    user = fields.Nested("UserSchema", only=("id", "email", "name"), dump_only=True)
    projrole = fields.Nested("ProjectRoleSchema", only=("id", "role_id", "name"), dump_only=True)
