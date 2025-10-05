# file: schemas/project_role_schemas.py
from marshmallow import Schema, fields

class ProjectRoleSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.Str(required=True)
