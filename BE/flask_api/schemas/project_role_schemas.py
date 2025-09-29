# file: schemas/project_role_schemas.py
from marshmallow import Schema, fields

class ProjectRoleSchema(Schema):
    id = fields.Int(dump_only=True)
    role_id = fields.Int(required=True)
    project_id = fields.Int(required=True)

    # Nested: sửa lại only để dùng đúng field name
    role = fields.Nested("RoleSchema", only=("id", "name"), dump_only=True)