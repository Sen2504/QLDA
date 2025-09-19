# schemas/task_schema.py
from marshmallow import Schema, fields

class TaskStatusSchema(Schema):
    id = fields.Int(dump_only=True)
    name_status = fields.Str(required=True)

class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    status_id = fields.Int(required=True)
    status = fields.Nested(TaskStatusSchema, dump_only=True)
