from marshmallow import Schema, fields

class SprintSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.Str(required=True)
    deadline = fields.Date(required=True)
