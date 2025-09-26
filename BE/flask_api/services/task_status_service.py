# file: services/task_status_service.py
from flask_api.extensions import db
from flask_api.models.task_status_models import TaskStatus

class TaskStatusService:
    @staticmethod
    def create(name_status):
        name_status = (name_status or '').strip()

        if not name_status:
            return None, "Tên trạng thái là bắt buộc."

        if TaskStatus.query.filter_by(name_status=name_status).first():
            return None, "Tên trạng thái đã tồn tại."

        new_status = TaskStatus(name_status=name_status)
        db.session.add(new_status)
        db.session.commit()
        return new_status, None

    @staticmethod
    def get_all():
        return TaskStatus.query.all()

    @staticmethod
    def get_by_id(status_id):
        return TaskStatus.query.get(status_id)

    @staticmethod
    def update(status_id, name_status):
        status = TaskStatus.query.get(status_id)
        if not status:
            return None, "Không tìm thấy trạng thái."

        name_status = (name_status or '').strip()
        if not name_status:
            return None, "Tên trạng thái là bắt buộc."

        if TaskStatus.query.filter(TaskStatus.name_status == name_status, TaskStatus.id != status_id).first():
            return None, "Tên trạng thái đã tồn tại."

        status.name_status = name_status
        db.session.commit()
        return status, None

    @staticmethod
    def delete(status_id):
        status = TaskStatus.query.get(status_id)
        if not status:
            return False, "Không tìm thấy trạng thái."

        db.session.delete(status)
        db.session.commit()
        return True, None
