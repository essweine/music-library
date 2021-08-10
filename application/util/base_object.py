import json
from sqlite3 import Row
from enum import Enum
from datetime import datetime, date

class BaseObject(object):

    def serialize(self):

        def convert(val):
            if isinstance(val, list):
                return [ convert(v) for v in val ]
            if isinstance(val, set):
                return set([ convert(v) for v in val ])
            if isinstance(val, dict):
                return dict([ (attr, convert(v)) for attr, v in val.items() ])
            if isinstance(val, BaseObject):
                return val.serialize()
            return val

        return dict([ (attr, convert(val)) for attr, val in self.__dict__.items() if not attr.startswith("_") ])

    def copy(self):

        def _copy(val):
            if isinstance(val, list):
                return [ _copy(v) for v in val ]
            if isinstance(val, set):
                return set([ _copy(v) for v in val ])
            if isinstance(val, dict):
                return dict([ (attr, _copy(v)) for attr, v in val.items() ])
            if isinstance(val, BaseObject):
                return val.copy()
            return val

        return self.__class__(**dict([ (attr, _copy(val)) for attr, val in self.__dict__.items() if not attr.startswith("_") ]))

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

    def __eq__(self, other):

        if other is None or not isinstance(other, self.__class__):
            return False
        return all([ self.__getattribute__(attr) == other.__getattribute__(attr) for attr in self.__dict__ if not attr.startswith("_") ])

    @classmethod
    def __subclasshook__(cls, subclass):
        return hasattr(subclass, 'serialize') and callable(subclass.serialize)

class JsonEncoder(json.JSONEncoder):

    def default(self, obj):

        if issubclass(obj.__class__, (BaseObject, )):
            return obj.serialize()
        elif isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(obj, date):
            return obj.strftime("%Y-%m-%d")
        elif isinstance(obj, Enum):
            return obj.value
        elif isinstance(obj, set):
            return list(obj)
        elif isinstance(obj, Row):
            return dict(obj)
        return json.JSONEncoder.default(self, obj)
