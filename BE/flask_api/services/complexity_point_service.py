from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.models.project_role_models import ProjectRole
from flask_api.extensions import db

class ComplexityPointService:
    @staticmethod
    def get_all():
        return ComplexityPoint.query.all()

    DEFAULT_POINTS = [0, 1, 2, 3, 5, 8]

    @staticmethod
    def get_options(project_id=None):
        query = ProjectRole.query
        if project_id:
            query = query.filter_by(project_id=project_id)

        roles = query.all()
        excluded = ["Project Owner", "Project Manager", "Scrum Master"]
        result = []
        seen = set()

        for r in roles:
            name = (r.name or "").strip()
            if not name or name in excluded:
                continue
            if name not in seen:
                seen.add(name)
                result.append({
                    "name": name,
                    "points": ComplexityPointService.DEFAULT_POINTS
                })
        return result


    @staticmethod
    def create(name, point):
        new_point = ComplexityPoint(name=name, point=point)
        db.session.add(new_point)
        db.session.commit()
        return new_point
