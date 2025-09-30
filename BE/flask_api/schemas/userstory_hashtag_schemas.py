from marshmallow import Schema, fields
from flask_api.schemas.hashtag_schemas import HashtagSchema

class UserStoryHashtagSchema(Schema):
    id = fields.Int(dump_only=True)
    hashtag = fields.Nested(HashtagSchema)   # lấy thông tin hashtag gốc
