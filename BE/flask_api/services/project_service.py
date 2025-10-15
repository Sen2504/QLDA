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
            return None, "Project name is required and cannot be left blank."

        # 1. Tạo project mới
        new_project = Project(
            name=name_project.strip(),
            description=(description or "").strip()
            
        )
        db.session.add(new_project)
        db.session.flush()  # để có ID project liền

        # 2. Sinh các ProjectRole cho project
        roles = Role.query.all()  # giả sử Role table đã có Owner, UX, Design, FE, BE
        project_roles = []
        for role in roles:
            proj_role = ProjectRole(
                project_id=new_project.id,
                role_id=role.id,
                name=role.name
            )
            db.session.add(proj_role)
            project_roles.append(proj_role)

        db.session.flush()  # để có ID_ProjRole

        # 3. Thêm người tạo vào Team với role Owner
        owner_role = next((pr for pr in project_roles if pr.role_id == 1), None)  # giả sử id_role=1 là Owner
        if not owner_role:
            db.session.rollback()
            return None, "Project Owner role not found."

        new_team_member = Team(
            user_id=user_id,
            projrole_id=owner_role.id
        )
        db.session.add(new_team_member)

        # 4. Commit tất cả
        try:
            db.session.commit()
            return new_project, None
        except Exception as e:
            db.session.rollback()
            return None, f"Error while create project: {str(e)}"
    
    @staticmethod
    def update(project_id, name, description):
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found."

        name = (name or "").strip()
        description = (description or "").strip()

        if not name:
            return None, "Name project is required."
        if not description:
            return None, "Project description is required."

        project.name = name
        project.description = description
        db.session.commit()
        return project, None
           
    # lấy danh sách project mà user tham gia
    @staticmethod
    def get_by_user(user_id):
        """
        Lấy danh sách project mà user tham gia.
        - Owner: thấy cả active + archived.
        - Member: chỉ thấy active.
        """
        query = (
            db.session.query(Project, Role.name.label("role_name"))
            .join(ProjectRole, ProjectRole.project_id == Project.id)
            .join(Team, Team.projrole_id == ProjectRole.id)
            .join(Role, Role.id == ProjectRole.role_id)
            .filter(Team.user_id == user_id, Project.status != "deleted")
        )

        results = []
        for project, role_name in query.all():
            # Nếu không phải Owner thì ẩn archived
            if project.status == "archived" and role_name != "Project Owner":
                continue
            results.append(project)

        return results
    
    @staticmethod
    def change_status(project_id, user_id, new_status):
        """
        Chỉ Owner có quyền thay đổi trạng thái project.
        new_status: active | archived | deleted
        """
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found."

        # Kiểm tra user có phải Owner không
        owner_projrole = (
            db.session.query(ProjectRole)
            .join(Role, ProjectRole.role_id == Role.id)
            .join(Team, Team.projrole_id == ProjectRole.id)
            .filter(
                ProjectRole.project_id == project_id,
                Role.name == "Project Owner",
                Team.user_id == user_id
            )
            .first()
        )
        if not owner_projrole:
            return None, "You do not have permission to change project status."

        # Cập nhật trạng thái
        if new_status not in ["active", "archived", "deleted"]:
            return None, "Invalid status."

        project.status = new_status
        db.session.commit()
        return project, None
    
