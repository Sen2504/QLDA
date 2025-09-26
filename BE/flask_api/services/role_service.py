# file: services/role_service.py
from flask_api.extensions import db
from flask_api.models.role_models import Role

class RoleService:
    @staticmethod
    def create(name_role):
        name_role = (name_role or "").strip()

        if not name_role:
            return None, "Tên role là bắt buộc."

        if Role.query.filter_by(name_role=name_role).first():
            return None, "Tên role đã tồn tại."

        new_role = Role(name_role=name_role)
        db.session.add(new_role)
        db.session.commit()
        return new_role, None

    @staticmethod
    def get_all():
        return Role.query.all()

    @staticmethod
    def get_by_id(role_id):
        return Role.query.get(role_id)

    @staticmethod
    def update(role_id, name_role):
        role = Role.query.get(role_id)
        if not role:
            return None, "Không tìm thấy role."

        name_role = (name_role or "").strip()
        if not name_role:
            return None, "Tên role là bắt buộc."

        if Role.query.filter(Role.name_role == name_role, Role.id_role != role_id).first():
            return None, "Tên role đã tồn tại."

        role.name_role = name_role
        db.session.commit()
        return role, None

    @staticmethod
    def delete(role_id):
        role = Role.query.get(role_id)
        if not role:
            return False, "Không tìm thấy role."

        db.session.delete(role)
        db.session.commit()
        return True, None
