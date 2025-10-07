from flask_api.models.issue_type_models import IssueType

class IssueTypeService:
    @staticmethod
    def get_all():
        return IssueType.query.all()
