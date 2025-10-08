from marshmallow import Schema, fields, validates, ValidationError


class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    description = fields.Str()
    user_story_id = fields.Int()
    status_id = fields.Int()
    team_id = fields.Int(load_only=True)
    due_date = fields.Date(allow_none=True)

    title = fields.Method("get_title", dump_only=True)
    status = fields.Method("get_status", dump_only=True)
    project_id = fields.Method("get_project_id", dump_only=True)
    assignee = fields.Method("get_assignee", dump_only=True)  # Giữ tương thích cũ (lấy người đầu tiên)
    assignees = fields.Method("get_assignees", dump_only=True)

    user_story = fields.Nested("UserStorySchema", only=("id", "name"), dump_only=True)

    # ------------------ CUSTOM FIELDS ------------------
    def get_title(self, obj):
        return obj.name if getattr(obj, "name", None) else None

    def get_status(self, obj):
        status = getattr(obj, "status", None)
        return status.name_status if status else None

    def get_project_id(self, obj):
        story = getattr(obj, "user_story", None)
        return story.project_id if story else None

    def get_assignee(self, obj):
        assignments = getattr(obj, "phan_cong", None) or []
        if not assignments:
            return None

        assignment = assignments[0]
        team = getattr(assignment, "team", None)
        if not team:
            return {"team_id": assignment.team_id}

        return {
            "team_id": assignment.team_id,
            "user_id": team.user_id,
            "projrole_id": team.projrole_id,
            "user_name": getattr(getattr(team, "user", None), "name", None),
            "user_email": getattr(getattr(team, "user", None), "email", None),
            "role_name": getattr(getattr(team, "projrole", None), "name", None),
        }

    def get_assignees(self, obj):
        assignments = getattr(obj, "phan_cong", None) or []
        results = []
        for a in assignments:
            team = getattr(a, "team", None)
            if not team:
                results.append({"team_id": a.team_id})
                continue
            results.append({
                "team_id": a.team_id,
                "user_id": team.user_id,
                "projrole_id": team.projrole_id,
                "user_name": getattr(getattr(team, "user", None), "name", None),
                "user_email": getattr(getattr(team, "user", None), "email", None),
                "role_name": getattr(getattr(team, "projrole", None), "name", None),
            })
        return results

    # ------------------ VALIDATION ------------------
    @validates("name")
    def validate_name(self, value, **kwargs):
        if value is None:
            return
        if not value.strip():
            raise ValidationError("Tên task là bắt buộc.")
        if len(value.strip()) > 200:
            raise ValidationError("Tên task không được dài hơn 200 ký tự.")

    @validates("description")
    def validate_description(self, value, **kwargs):
        if value is None:
            return
        if not value.strip():
            raise ValidationError("Mô tả task là bắt buộc.")


# ------------------ CREATE ------------------
class TaskCreateSchema(TaskSchema):
    name = fields.Str(required=True, error_messages={"required": "Vui lòng nhập tên task."})
    description = fields.Str(required=True, error_messages={"required": "Vui lòng nhập mô tả task."})
    user_story_id = fields.Int(required=True, error_messages={"required": "Vui lòng chọn user story."})
    status_id = fields.Int(required=True, error_messages={"required": "Vui lòng chọn trạng thái task."})
    # Giữ team_id để tương thích cũ (1 người)
    team_id = fields.Int(load_only=True)
    # Mới: danh sách nhiều team id
    team_ids = fields.List(fields.Int(), load_only=True)

    @validates("team_ids")
    def validate_team_ids(self, value, **kwargs):
        # Cho phép rỗng nếu dùng team_id đơn lẻ
        if value is None:
            return
        if isinstance(value, list) and len(value) == 0:
            # nếu list rỗng & không có team_id fallback => raise
            pass

    @validates("team_id")
    def validate_team_id_or_ids(self, value, **kwargs):
        # Ít nhất 1 trong 2: team_id hoặc team_ids gửi lên
        # Marshmallow không dễ kiểm tra cả 2 ở đây, phần logic chính xử lý ở service.
        return


# ------------------ UPDATE ------------------
class TaskUpdateSchema(Schema):
    name = fields.Str()
    description = fields.Str()
    user_story_id = fields.Int()
    status_id = fields.Int()
    team_id = fields.Int(load_only=True)
    due_date = fields.Date(allow_none=True)

    @validates("name")
    def validate_name(self, value, **kwargs):
        if value is None:
            return
        if not value.strip():
            raise ValidationError("Tên task không được để trống.")
        if len(value.strip()) > 200:
            raise ValidationError("Tên task không được dài hơn 200 ký tự.")

    @validates("description")
    def validate_description(self, value, **kwargs):
        if value is None:
            return
        if not value.strip():
            raise ValidationError("Mô tả task không được để trống.")
