import json
from enum import Enum
from datetime import datetime, date
from abc import ABC

class JsonSerializable(ABC):

    def as_dict(self):
        return dict([ (attr, val) for attr, val in self.__dict__.items() if not attr.startswith("_") ])

    def copy(self):

        _copy = lambda v: v.copy() if "copy" in v.__dir__() else v
        return self.__class__(*[ _copy(val) for attr, val in self.__dict__.items() if not attr.startswith("_") ])

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

    def __eq__(self, other):

        if other is None:
            return False
        return all([ self.__getattribute__(attr) == other.__getattribute__(attr) for attr in self.__dict__ if not attr.startswith("_") ])

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
        return json.JSONEncoder.default(self, obj)
