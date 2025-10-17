from functools import wraps
from flask import request, jsonify
from flask_login import current_user
from flask_api.services.permission_service import PermissionService

# Optional helpers to resolve project_id from various entity IDs.
# These are kept here to avoid duplicating logic in routes.
try:
    from flask_api.models.task_models import Task
    from flask_api.models.user_story_models import UserStory
    from flask_api.models.issue_models import Issue
    from flask_api.models.sprint_models import Sprint
    from flask_api.models.phan_cong_models import PhanCong
    from flask_api.models.team_models import Team
except Exception:
    # In case of import ordering issues during tooling or migrations.
    Task = UserStory = Issue = Sprint = PhanCong = Team = None


def _extract_project_id_from_request():
    """Try best-effort extraction of project_id from request payloads.

    Supports JSON, form-data, and common key variants (project_id, Project_id).
    """
    project_id = None
    # JSON body
    try:
        body = request.get_json(silent=True) or {}
        project_id = body.get("project_id") or body.get("Project_id")
    except Exception:
        project_id = None

    # form-data
    if project_id is None and hasattr(request, "form"):
        project_id = request.form.get("project_id") or request.form.get("Project_id")

    # query string
    if project_id is None:
        project_id = request.args.get("project_id")

    return int(project_id) if project_id not in (None, "", "null") else None


def get_project_id_from_task(task_id: int):
    if not Task or not UserStory:
        return None
    task = Task.query.get(task_id)
    if not task:
        return None
    # Task links to UserStory which has project_id
    us = task.user_story or UserStory.query.get(task.user_story_id)
    return us.project_id if us else None


def get_project_id_from_user_story(user_story_id: int):
    if not UserStory:
        return None
    us = UserStory.query.get(user_story_id)
    return us.project_id if us else None


def get_project_id_from_issue(issue_id: int):
    if not Issue:
        return None
    issue = Issue.query.get(issue_id)
    return issue.project_id if issue else None


def get_project_id_from_sprint(sprint_id: int):
    if not Sprint:
        return None
    sp = Sprint.query.get(sprint_id)
    return sp.project_id if sp else None


def get_project_id_from_body_user_story():
    """Resolve project_id from user_story_id present in JSON or form-data."""
    if not UserStory:
        return None
    us_id = None
    try:
        body = request.get_json(silent=True) or {}
        us_id = body.get("user_story_id") or body.get("User_story_id")
    except Exception:
        us_id = None
    if us_id is None and hasattr(request, "form"):
        us_id = request.form.get("user_story_id") or request.form.get("User_story_id")
    try:
        us_id = int(us_id) if us_id is not None else None
    except Exception:
        us_id = None
    return get_project_id_from_user_story(us_id) if us_id is not None else None


def is_user_involved_in_user_story(user_id: int, user_story_id: int) -> bool:
    """Return True if user is assigned to any task under the given user story.

    This supports a "view-own by involvement" policy for UserStory detail.
    """
    if not (Task and PhanCong and Team):
        return False
    try:
        from flask_api.extensions import db
        exists_row = (
            db.session.query(PhanCong.team_id)
            .join(Task, PhanCong.task_id == Task.id)
            .join(Team, PhanCong.team_id == Team.id)
            .filter(Task.user_story_id == int(user_story_id), Team.user_id == int(user_id))
            .first()
        )
        return bool(exists_row)
    except Exception:
        return False


def is_user_assigned_to_task(user_id: int, task_id: int) -> bool:
    """Return True if user is assigned to the given task via PhanCong->Team."""
    if not (PhanCong and Team):
        return False
    try:
        from flask_api.extensions import db
        exists_row = (
            db.session.query(PhanCong.team_id)
            .join(Team, PhanCong.team_id == Team.id)
            .filter(PhanCong.task_id == int(task_id), Team.user_id == int(user_id))
            .first()
        )
        return bool(exists_row)
    except Exception:
        return False


def require_permission(resource_name, action_name, project_id_getter=None, fallback_allow=None):
    """Decorator to require a permission for current_user.

    project_id_getter: callable(*args, **kwargs) -> project_id (int)
    If None, the decorator will try to read 'project_id' from JSON body, form-data, or query params.
    fallback_allow: optional callable(user_id, project_id, *args, **kwargs) -> bool
      If provided and the main permission check denies, this function can allow the request (e.g., view-own).
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # determine project_id
            project_id = None
            if project_id_getter:
                try:
                    project_id = project_id_getter(*args, **kwargs)
                except Exception:
                    project_id = None

            if project_id is None:
                project_id = _extract_project_id_from_request()

            if project_id is None:
                # For non-creation flows (GET/PUT/DELETE), allow handler to run.
                # Typical case: entity doesn't exist -> handler returns 404.
                # For POST (creation), project_id is mandatory to scope permission.
                if request.method == "POST":
                    return jsonify({"error": "Missing project_id for permission check."}), 400
                return f(*args, **kwargs)

            allowed = PermissionService.check_permission(current_user.id, int(project_id), resource_name, action_name)
            if not allowed:
                # Optional fallback allowance (e.g., view-own item)
                if callable(fallback_allow):
                    try:
                        if fallback_allow(current_user.id, int(project_id), *args, **kwargs):
                            return f(*args, **kwargs)
                    except Exception:
                        pass
                return jsonify({"error": "Your role is not allowed for this action."}), 403
            return f(*args, **kwargs)

        return wrapped
    return decorator
