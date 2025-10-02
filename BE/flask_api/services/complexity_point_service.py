from flask_api.models.complexity_point_models import ComplexityPoint
from flask_api.extensions import db

class ComplexityPointService:
    @staticmethod
    def get_all():
        return ComplexityPoint.query.all()

    @staticmethod
    def get_options():
        points = ComplexityPoint.query.all()
        grouped = {}
        for p in points:
            grouped.setdefault(p.name, []).append(p.point)
        return [{"name": name, "points": sorted(vals)} for name, vals in grouped.items()]

    @staticmethod
    def create(name, point):
        new_point = ComplexityPoint(name=name, point=point)
        db.session.add(new_point)
        db.session.commit()
        return new_point
