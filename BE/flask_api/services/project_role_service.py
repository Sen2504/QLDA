# file: services/project_role_service.py
from flask_api.extensions import db
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.role_models import Role

class ProjectRoleService:
    @staticmethod
    def get_all():
        return ProjectRole.query.all()
    
    @staticmethod
    def get_by_id(projrole_id):
        return ProjectRole.query.get(projrole_id)
    
    @staticmethod
    def get_by_project(project_id):
        return ProjectRole.query.filter_by(project_id=project_id).all()
    
    @staticmethod
    def create(project_id, role_id):
        # Kiểm tra role có tồn tại
        role = Role.query.get(role_id)
        if not role:
            return None, "Không tìm thấy role."

        new_proj_role = ProjectRole(
            project_id=project_id,
            role_id=role_id
        )
        db.session.add(new_proj_role)
        db.session.commit()
        return new_proj_role, None
    
    @staticmethod
    def delete(projrole_id):
        proj_role = ProjectRole.query.get(projrole_id)
        if not proj_role:
            return False, "Không tìm thấy ProjectRole."
        
        db.session.delete(proj_role)
        db.session.commit()
        return True, None
