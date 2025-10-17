# file: services/project_role_service.py
from flask_api.extensions import db
from flask_api.models.project_role_models import ProjectRole
from flask_api.models.role_models import Role
from flask_api.models.permission_models import Permission


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
        """
        Tạo ProjectRole từ role toàn cục.
        Copy luôn name từ Role sang ProjectRole.
        """
        role = Role.query.get(role_id)
        if not role:
            return None, "Không tìm thấy role."

        new_proj_role = ProjectRole(
            project_id=project_id,
            role_id=role_id,
            name=role.name_role       # copy tên toàn cục vô project role
        )
        db.session.add(new_proj_role)
        db.session.commit()
        return new_proj_role, None
    
    @staticmethod
    def delete(projrole_id):
        proj_role = ProjectRole.query.get(projrole_id)
        if not proj_role:
            return False, "Không tìm thấy ProjectRole."

        # Only custom roles (no global role link) can be deleted via this flow
        if proj_role.role_id is not None:
            return False, "Chỉ được xóa vai trò Custom."

        # Safety: never delete Project Owner by name (defense-in-depth)
        if (getattr(proj_role.role, "name", None) == "Project Owner") or (proj_role.name == "Project Owner"):
            return False, "Không thể xóa vai trò Project Owner."

        # Prevent deletion if any team members are assigned to this role
        if proj_role.teams and len(proj_role.teams) > 0:
            return False, f"Không thể xóa: còn {len(proj_role.teams)} thành viên đang dùng vai trò này."

        try:
            # Explicitly delete permissions for this role to avoid setting FK to NULL
            Permission.query.filter_by(projrole_id=projrole_id).delete(synchronize_session=False)

            # Delete the project role itself
            db.session.delete(proj_role)
            db.session.commit()
            # Invalidate permission caches so subsequent checks reflect deletion
            try:
                from flask_api.services.permission_service import PermissionService
                PermissionService.invalidate_cache()
            except Exception:
                pass
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, "Lỗi khi xóa vai trò."
    
    @staticmethod
    def create_custom(project_id, name_role):
        """
        Tạo ProjectRole custom (không cần tồn tại trong bảng Role).
        """
        if not name_role or not name_role.strip():
            return None, "Tên role không được để trống."

        new_proj_role = ProjectRole(
            project_id=project_id,
            role_id=None,             # custom thì không FK tới Role
            name=name_role.strip()
        )
        db.session.add(new_proj_role)
        db.session.commit()
        return new_proj_role, None
