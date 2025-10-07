from flask_api.models.issue_resolve_models import IssueResolve

class IssueResolveService:
    @staticmethod
    def get_all():
        return IssueResolve.query.all()
