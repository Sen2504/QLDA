import json
from flask import Blueprint, request, make_response
from flask_api.extensions import db

class BaseCRUD:
    def __init__(self, model, schema_func, url_prefix):
        self.model = model
        self.schema_func = schema_func
        self.blueprint = Blueprint(model.__name__.lower(), __name__, url_prefix=url_prefix)
        self.register_routes()

    def _json_response(self, data, status=200):
        response = make_response(json.dumps(data, ensure_ascii=False), status)
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response

    def register_routes(self):
        self.blueprint.add_url_rule('/', view_func=self.get_all, methods=['GET'])
        self.blueprint.add_url_rule('/', view_func=self.create, methods=['POST'])
        self.blueprint.add_url_rule('/<int:item_id>', view_func=self.update, methods=['PUT'])
        self.blueprint.add_url_rule('/<int:item_id>', view_func=self.delete, methods=['DELETE'])

    def get_all(self):
        items = self.model.query.all()
        return self._json_response([self.schema_func(item) for item in items])

    def create(self):
        data = request.get_json()
        new_item = self.model(**data)
        db.session.add(new_item)
        db.session.commit()
        return self._json_response(self.schema_func(new_item), 201)

    def update(self, item_id):
        item = self.model.query.get_or_404(item_id)
        data = request.get_json()
        for key, value in data.items():
            setattr(item, key, value)
        db.session.commit()
        return self._json_response(self.schema_func(item))

    def delete(self, item_id):
        item = self.model.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return self._json_response({}, 204)
