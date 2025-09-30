from marshmallow import Schema, fields

class ComplexityPointSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    point = fields.Float(required=True)
    user_story_id = fields.Int()
