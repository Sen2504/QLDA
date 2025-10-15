from marshmallow import Schema, fields


class TaskCommentSchema(Schema):
    id = fields.Int(dump_only=True)
    task_id = fields.Int(dump_only=True)
    user_id = fields.Int(allow_none=True)
    team_id = fields.Int(allow_none=True)
    content = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)

    user = fields.Method("get_user", dump_only=True)
    team = fields.Method("get_team", dump_only=True)
    author_name = fields.Method("get_author_name", dump_only=True)

    def get_user(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return None
        return {
            "id": getattr(user, "id", None),
            "name": getattr(user, "name", None),
            "email": getattr(user, "email", None),
        }

    def get_team(self, obj):
        team = getattr(obj, "team", None)
        if not team:
            return None
        projrole = getattr(team, "projrole", None)
        return {
            "id": getattr(team, "id", None),
            "projrole_id": getattr(team, "projrole_id", None),
            "role_name": getattr(projrole, "name", None) if projrole else None,
        }

    def get_author_name(self, obj):
        user = getattr(obj, "user", None)
        if user and getattr(user, "name", None):
            return user.name
        team = getattr(obj, "team", None)
        if team and getattr(team, "user", None):
            user_obj = team.user
            if getattr(user_obj, "name", None):
                return user_obj.name
        return "Anonymous member"


class TaskCommentCreateSchema(Schema):
    content = fields.Str(required=True, error_messages={"required": "Please enter comment content."})
    team_id = fields.Int(allow_none=True)
