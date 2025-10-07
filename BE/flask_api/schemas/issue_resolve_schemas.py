from marshmallow import Schema, fields

class IssueResolveSchema(Schema):
    team_id = fields.Int(allow_none=True)
    issue_id = fields.Int(required=True)
