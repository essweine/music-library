import json
from enum import Enum
from datetime import datetime, date
from abc import ABC

from requests import Response

class JsonSerializable(ABC):

    def as_dict(self):
        return self.__dict__.copy()

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

    @classmethod
    def row_factory(cls, cursor, row):
        return cls(dict([ (col[0], row[idx]) for idx, col in enumerate(cursor.description) ]))

    @classmethod
    def __subclasshook__(cls, subclass):
        return hasattr(subclass, 'as_dict') and callable(subclass.as_dict)

class JsonEncoder(json.JSONEncoder):

    def default(self, obj):

        if issubclass(obj.__class__, (JsonSerializable, )):
            return obj.as_dict()
        elif isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        elif isinstance(obj, date):
            return obj.strftime("%Y-%m-%d")
        elif isinstance(obj, Enum):
            return obj.value
        elif isinstance(obj, Response):
            return obj.url
        return json.JSONEncoder.default(self, obj)
