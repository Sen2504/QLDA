from marshmallow import Schema, fields


class PermissionMatrixSchema(Schema):
    roles = fields.List(fields.Dict())
    resources = fields.List(fields.String())
    actions = fields.List(fields.String())
    matrix = fields.Dict()


class PermissionUpdateSchema(Schema):
    # Expecting {resource_name: {action_name: bool}}
    updates = fields.Dict(keys=fields.Str(), values=fields.Dict(keys=fields.Str(), values=fields.Boolean()))
