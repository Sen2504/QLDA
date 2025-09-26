# file: services/project_service.py
from flask_api.extensions import db
from flask_api.models.project_models import Project
from flask_api.models.role_models import Role
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.team_models import Team

class ProjectService:
    @staticmethod
    def get_all():
        return Project.query.all()

    @staticmethod
    def get_by_id(project_id):
        return Project.query.get(project_id)
    
    @staticmethod
    def create(name_project, description, user_id):
        # Validate input
        if not name_project or not name_project.strip():
            return None, "Tên project là bắt buộc không được bỏ trống."

        # 1. Tạo project mới
        new_project = Project(
            name=name_project.strip(),
            description=(description or "").strip()
        )

        db.session.add(new_project)
        db.session.flush()  # để có ID project ngay

        # 2. Sinh các ProjectRole cho project
        roles = Role.query.all()  # giả sử Role table đã có Owner, UX, Design, FE, BE
        project_roles = []
        for role in roles:
            proj_role = ProjectRole(
                project_id=new_project.id,
                role_id=role.id
            )

            db.session.add(proj_role)
            project_roles.append(proj_role)

        db.session.flush()  # để có ID_ProjRole

        # 3. Thêm người tạo vào Team với role Owner
        owner_role = next((pr for pr in project_roles if pr.role_id == 1), None)  # giả sử id_role=1 là Owner
        if not owner_role:
            return None, "Không tìm thấy role Project Owner."

        new_team_member = Team(
            user_id=user_id,
            projrole_id=owner_role.id
        )
        db.session.add(new_team_member)

        # 4. Commit tất cả
        db.session.commit()

        return new_project, None
    
    @staticmethod
    def update(project_id, name, description):
        project = Project.query.get(project_id)
        if not project:
            return None, "Không tìm thấy project."

        name = (name or "").strip()
        description = (description or "").strip()

        if not name:
            return None, "Tên project là bắt buộc."
        if not description:
            return None, "Mô tả project là bắt buộc."

        project.name = name
        project.description = description
        db.session.commit()
        return project, None
    
    @staticmethod
    def delete(project_id):
        project = Project.query.get(project_id)
        if not project:
            return False, "Không tìm thấy project."

        db.session.delete(project)
        db.session.commit()
        return True, None
