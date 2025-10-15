# file: services/action_service.py
from flask_api.extensions import db
from flask_api.models.action_models import Action

class ActionService:
    @staticmethod
    def create(name_act):
        name_act = (name_act or "").strip()

        if not name_act:
            return None, "Action name is required."

        if Action.query.filter_by(Name_act=name_act).first():
            return None, "The action name already exists."

        new_action = Action(Name_act=name_act)
        db.session.add(new_action)
        db.session.commit()
        return new_action, None

    @staticmethod
    def get_all():
        return Action.query.all()

    @staticmethod
    def get_by_id(action_id):
        return Action.query.get(action_id)

    @staticmethod
    def update(action_id, name_act):
        action = Action.query.get(action_id)
        if not action:
            return None, "Action not found."

        name_act = (name_act or "").strip()
        if not name_act:
            return None, "Action name is required."

        if Action.query.filter(Action.Name_act == name_act, Action.ID_act != action_id).first():
            return None, "The action name already exists."

        action.Name_act = name_act
        db.session.commit()
        return action, None

    @staticmethod
    def delete(action_id):
        action = Action.query.get(action_id)
        if not action:
            return False, "Action not found."

        db.session.delete(action)
        db.session.commit()
        return True, None
