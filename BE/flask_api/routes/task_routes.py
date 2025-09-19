import re
from flask import request, jsonify
from flask_api.extensions import db
from flask_api.routes.crud.base_crud import BaseCRUD
from flask_api.routes.models.task_models import Task, TaskStatus
from flask_api.routes.schemas.task_schemas import TaskSchema, TaskStatusSchema

class TaskStatusCRUD(BaseCRUD):
    def _validate_name(self, name: str):
        if not name:
            return "Tên trạng thái là bắt buộc."
        if not re.match(r"^[^\W\d_]+(?:\s[^\W\d_]+)*$", name.strip(), flags=re.UNICODE):
            return "Tên trạng thái chỉ được chứa chữ và khoảng trắng (không số, không ký tự đặc biệt)."
        return None

    def create(self):
        data = request.get_json() or {}
        name_status = (data.get("name_status") or "").strip()

        err = self._validate_name(name_status)
        if err:
            return jsonify({"error": err}), 400

        item = self.model(name_status=name_status)
        db.session.add(item)
        db.session.commit()
        return jsonify(self.schema_func(item)), 201

    def update(self, item_id):
        data = request.get_json() or {}
        item = self.model.query.get_or_404(item_id)

        if "name_status" in data:
            name_status = (data.get("name_status") or "").strip()
            err = self._validate_name(name_status)
            if err:
                return jsonify({"error": err}), 400
            item.name = name_status

        db.session.commit()
        return jsonify(self.schema_func(item)), 200

# CRUD cho Task và TaskStatus
task_crud = BaseCRUD(Task, lambda x: TaskSchema().dump(x), url_prefix='/api/tasks')
task_status_crud = TaskStatusCRUD(TaskStatus, lambda x: TaskStatusSchema().dump(x), url_prefix='/api/task_status')

# Blueprint cho app factory
task_bp = task_crud.blueprint
task_status_bp = task_status_crud.blueprint
