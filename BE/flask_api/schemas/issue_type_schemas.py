from marshmallow import Schema, fields

class IssueTypeSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
