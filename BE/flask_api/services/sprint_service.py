from flask_api.models.sprint_models import Sprint
from flask_api.models.user_story_models import UserStory
from flask_api.extensions import db

class SprintService:

    @staticmethod
    def create(data):
        new_sprint = Sprint(**data)
        db.session.add(new_sprint)
        db.session.commit()
        return new_sprint, None

    @staticmethod
    def get_by_project(project_id):
        return Sprint.query.filter_by(project_id=project_id).all()

    @staticmethod
    def add_user_story(sprint_id, user_story_id):
        user_story = UserStory.query.get(user_story_id)
        if not user_story:
            return None, "User Story not found."
        user_story.sprint_id = sprint_id
        db.session.commit()
        return user_story, None

    @staticmethod
    def remove_user_story(user_story_id):
        user_story = UserStory.query.get(user_story_id)
        if not user_story:
            return None, "User Story not found."
        user_story.sprint_id = None
        db.session.commit()
        return user_story, None
