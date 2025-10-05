from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.extensions import db

class ComplexityPointService:
    @staticmethod
    def get_all():
        return ComplexityPoint.query.all()

    DEFAULT_POINTS = [0, 1, 2, 3, 5, 8]

    @staticmethod
    def get_options():
        from flask_api.models.role_models import Role

        roles = Role.query.all()
        excluded = ["Project Owner", "Project Manager", "Scrum Master"]
        result = []
        for r in roles:
            if r.name not in excluded:
                result.append({
                    "name": r.name.strip(),   # đảm bảo giống hệt Role.name
                    "points": ComplexityPointService.DEFAULT_POINTS
                })
        return result

    @staticmethod
    def create(name, point):
        new_point = ComplexityPoint(name=name, point=point)
        db.session.add(new_point)
        db.session.commit()
        return new_point
