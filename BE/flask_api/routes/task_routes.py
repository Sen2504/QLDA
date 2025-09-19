# routes/task_routes.py
from flask_api.routes.crud.base_crud import BaseCRUD
from flask_api.routes.models.task_models import Task, TaskStatus
from flask_api.routes.schemas.task_schemas import TaskSchema, TaskStatusSchema

task_crud = BaseCRUD(Task, lambda x: TaskSchema().dump(x), url_prefix='/tasks')
task_status_crud = BaseCRUD(TaskStatus, lambda x: TaskStatusSchema().dump(x), url_prefix='/task_status')

# Dùng như blueprint trong app factory
task_bp = task_crud.blueprint
task_status_bp = task_status_crud.blueprint
