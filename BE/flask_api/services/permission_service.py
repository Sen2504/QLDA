from functools import lru_cache
from flask_api.extensions import db
from flask_api.models import Permission, Resource, Action, ProjectRole, Team, Role
import time


class PermissionService:
    # Constants for locked rules
    FORCED_VIEW_RESOURCES = {"UserStory", "Sprint", "Issue"}
    OWNER_ROLE_NAME = "Project Owner"
    
    # TTL Cache storage
    _cache = {}
    _cache_ttl = 60  # Cache duration in seconds (1 minute)

    @staticmethod
    def _get_cache_key(func_name, *args):
        """Generate cache key from function name and arguments"""
        return f"{func_name}:{':'.join(map(str, args))}"
    
    @staticmethod
    def _get_from_cache(key):
        """Get value from cache if not expired"""
        if key in PermissionService._cache:
            value, timestamp = PermissionService._cache[key]
            if time.time() - timestamp < PermissionService._cache_ttl:
                return value, True
        return None, False
    
    @staticmethod
    def _set_to_cache(key, value):
        """Store value in cache with current timestamp"""
        PermissionService._cache[key] = (value, time.time())

    @staticmethod
    def _allowed_actions_for_resource(resource_name: str, all_action_names: list[str]) -> list[str]:
        """Return allowed action names for a resource.

        Business rule: "Comment" is only applicable to resources "Task" and "Issue".
        All other actions apply to all resources by default.
        """
        if not all_action_names:
            return []
        if resource_name in {"Task", "Issue"}:
            return all_action_names
        # exclude Comment for non-Task/Issue resources
        return [a for a in all_action_names if a != "Comment"]

    @staticmethod
    def _is_owner_projrole(projrole_id: int) -> bool:
        if not projrole_id:
            return False
        
        # Check cache first
        cache_key = PermissionService._get_cache_key("is_owner", projrole_id)
        cached_value, found = PermissionService._get_from_cache(cache_key)
        if found:
            return cached_value
        
        pr = (
            db.session.query(ProjectRole)
            .outerjoin(Role, ProjectRole.role_id == Role.id)
            .filter(ProjectRole.id == projrole_id)
            .first()
        )
        if not pr:
            result = False
        else:
            # Kiểm tra cả global role và project role name
            if pr.role and pr.role.name == PermissionService.OWNER_ROLE_NAME:
                result = True
            else:
                result = pr.name == PermissionService.OWNER_ROLE_NAME
        
        # Store in cache
        PermissionService._set_to_cache(cache_key, result)
        return result
    @staticmethod
    def check_permission(user_id, project_id, resource_name, action_name):
        """Return True if user has permission for action on resource in project."""
        projrole_id = PermissionService._projrole_for_user_project(user_id, project_id)
        if projrole_id is None:
            return False
        return PermissionService._check_by_projrole(projrole_id, resource_name, action_name)

    @staticmethod
    def _projrole_for_user_project(user_id, project_id):
        # Check cache first
        cache_key = PermissionService._get_cache_key("projrole", user_id, project_id)
        cached_value, found = PermissionService._get_from_cache(cache_key)
        if found:
            return cached_value
        
        # Return the first matching ProjectRole id for this user in this project
        row = (
            db.session.query(Team.projrole_id)
            .join(ProjectRole, Team.projrole_id == ProjectRole.id)
            .filter(Team.user_id == user_id, ProjectRole.project_id == project_id)
            .first()
        )
        result = row[0] if row else None
        
        # Store in cache
        PermissionService._set_to_cache(cache_key, result)
        return result

    @staticmethod
    def _check_by_projrole(projrole_id, resource_name, action_name):
        # Check cache first
        cache_key = PermissionService._get_cache_key("check_perm", projrole_id, resource_name, action_name)
        cached_value, found = PermissionService._get_from_cache(cache_key)
        if found:
            return cached_value
        
        # Owner: full access, locked true
        if PermissionService._is_owner_projrole(projrole_id):
            result = True
        # Forced view permissions: always true for everyone
        elif action_name == "View" and resource_name in PermissionService.FORCED_VIEW_RESOURCES:
            result = True
        else:
            # join permission -> resource & action
            perm = (
                Permission.query.join(Resource)
                .join(Action)
                .filter(
                    Permission.projrole_id == projrole_id,
                    Resource.name == resource_name,
                    Action.name == action_name,
                )
                .first()
            )
            if not perm:
                result = False
            else:
                result = bool(perm.is_allowed)
        
        # Store in cache
        PermissionService._set_to_cache(cache_key, result)
        return result

    @staticmethod
    def invalidate_cache():
        """Clear all cached permission data"""
        PermissionService._cache.clear()

    @staticmethod
    def get_matrix_for_project(project_id):
        """Return a dict of {projrole_id: {resource_name: {action_name: is_allowed}}}
        Includes all ProjectRoles for the project and all resources/actions.
        """
        roles = (
            ProjectRole.query
            .filter_by(project_id=project_id)
            .all()
        )
        resources = Resource.query.all()
        actions = Action.query.all()
        action_names = [a.name for a in actions]

        matrix = {}
        for r in roles:
            per_res = {}
            for res in resources:
                allowed = PermissionService._allowed_actions_for_resource(res.name, action_names)
                # default False, will override for locks
                per_res[res.name] = {act_name: False for act_name in allowed}
            matrix[r.id] = per_res

        # If no roles, return empty matrix early
        if not roles:
            return {
                "roles": [],
                "resources": [res.name for res in resources],
                "actions": action_names,
                "matrix": matrix,
            }

        # prefetch permissions only for roles in this project
        role_ids = [r.id for r in roles]
        perms = (
            Permission.query
            .filter(Permission.projrole_id.in_(role_ids))
            .all()
        )

        for p in perms:
            res_name = p.resource.name
            act_name = p.action.name
            # ignore invalid combinations (e.g., Comment on non-Task)
            if res_name not in matrix.get(p.projrole_id, {}):
                continue
            if act_name not in matrix[p.projrole_id][res_name]:
                continue
            matrix[p.projrole_id][res_name][act_name] = bool(p.is_allowed)

        # Enforce locked rules on matrix view
        for r in roles:
            # Owner: all true
            if PermissionService._is_owner_projrole(r.id):
                for res in resources:
                    allowed = PermissionService._allowed_actions_for_resource(res.name, action_names)
                    for act in allowed:
                        matrix[r.id][res.name][act] = True
                continue
            # Everyone: View on specified resources is always true
            for res in resources:
                if res.name in PermissionService.FORCED_VIEW_RESOURCES and "View" in matrix[r.id][res.name]:
                    matrix[r.id][res.name]["View"] = True

        return {
            "roles": [{"id": r.id, "name": r.name} for r in roles],
            "resources": [res.name for res in resources],
            "actions": action_names,
            "matrix": matrix,
        }

    @staticmethod
    def get_user_permissions_in_project(user_id, project_id):
        """Return all permissions for a specific user in a project.
        
        Returns:
            dict: {
                "role_id": int,
                "role_name": str,
                "permissions": {
                    "ResourceName": {
                        "ActionName": bool
                    }
                }
            }
        """
        # Get user's project role
        projrole_id = PermissionService._projrole_for_user_project(user_id, project_id)
        if projrole_id is None:
            return None
        
        projrole = ProjectRole.query.get(projrole_id)
        if not projrole:
            return None
        
        # Get all resources and actions
        resources = Resource.query.all()
        actions = Action.query.all()
        action_names = [a.name for a in actions]
        
        # Build permissions map
        permissions = {}
        for res in resources:
            allowed_actions = PermissionService._allowed_actions_for_resource(res.name, action_names)
            permissions[res.name] = {}
            for act_name in allowed_actions:
                # Use the same check logic as permission enforcement
                permissions[res.name][act_name] = PermissionService._check_by_projrole(
                    projrole_id, res.name, act_name
                )
        
        return {
            "role_id": projrole.id,
            "role_name": projrole.name,
            "permissions": permissions
        }

    @staticmethod
    def set_permissions_bulk(project_id, projrole_id, updates):
        """updates: {resource_name: {action_name: bool}} sets permissions accordingly for projrole in project.
        This will upsert Permission rows; any missing combinations will be created with is_allowed False by default.
        """
        # ensure projrole belongs to project
        pr = ProjectRole.query.filter_by(id=projrole_id, project_id=project_id).first()
        if not pr:
            raise ValueError("ProjectRole not found for project")

        # Block any attempt to change Project Owner permissions
        if PermissionService._is_owner_projrole(projrole_id):
            raise ValueError("Không thể thay đổi quyền của Project Owner.")

        # build a map for quick lookup
        resource_map = {r.name: r for r in Resource.query.all()}
        action_map = {a.name: a for a in Action.query.all()}

        # determine allowed actions per resource using current action table
        action_names = list(action_map.keys())

        for res_name, actions in updates.items():
            res = resource_map.get(res_name)
            if not res:
                continue
            allowed_actions = set(PermissionService._allowed_actions_for_resource(res.name, action_names))
            for act_name, allowed in actions.items():
                # skip invalid combos
                if act_name not in allowed_actions:
                    continue
                # Force view on specific resources to always be True and locked
                if act_name == "View" and res.name in PermissionService.FORCED_VIEW_RESOURCES:
                    allowed = True
                act = action_map.get(act_name)
                if not act:
                    continue
                perm = Permission.query.filter_by(projrole_id=projrole_id, resource_id=res.id, action_id=act.id).first()
                if perm:
                    perm.is_allowed = bool(allowed)
                else:
                    perm = Permission(projrole_id=projrole_id, resource_id=res.id, action_id=act.id, is_allowed=bool(allowed))
                    db.session.add(perm)

        db.session.commit()
        PermissionService.invalidate_cache()
        return True
