from flask_api.extensions import db
from flask_api.models.role_models import Role

class RoleService:
    
    @staticmethod
    def create(name):
        name = (name or "").strip()

        if not name:
            return None, "Role name is required."

        if Role.query.filter_by(name=name).first():
            return None, "Role name has been existed."

        new_role = Role(name=name)
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
    def update(role_id, name):
        role = Role.query.get(role_id)
        if not role:
            return None, "Can not found role."

        name = (name or "").strip()
        if not name:
            return None, "Role name is required."

        if Role.query.filter(Role.name == name, Role.id != role_id).first():
            return None, "Role name has been existed."

        role.name = name
        db.session.commit()
        return role, None

    @staticmethod
    def delete(role_id):
        role = Role.query.get(role_id)
        if not role:
            return False, "No role found."

        db.session.delete(role)
        db.session.commit()
        return True, None
