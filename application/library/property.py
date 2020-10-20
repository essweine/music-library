from ..util.db import Column, Subquery, Aggregation, Table
from ..util import BaseObject

PROPERTY_COLUMNS = [
    Column("recording_id", "text", False, True),
    Column("filename", "text", False, True),
    Column("category", "text", True, True),
    Column("value", "text", True, True),
]

PROPERTY_AGGREGATE = [
    ("category", "group_concat(category, '::')"), 
    ("value", "group_concat(value, '::')"),
]
TRACK_AGGREGATE = Aggregation(PROPERTY_AGGREGATE, "filename")
RECORDING_AGGREGATE = Aggregation(PROPERTY_AGGREGATE, "id")

TRACK_PROPS = Subquery([
    ("filename", None),
    ("category", None),
    ("value", None),
], "property", False)

RECORDING_PROPS = Subquery([
    ("id", "recording_id"), 
    ("category", None),
    ("value", None),
], "property", True)

PropertyTable = Table("property", PROPERTY_COLUMNS, "filename")

class PropertyView(BaseObject):

    def __init__(self, item):

        props = self._parse_properties(item)
        for prop in self.PROPERTIES:
            self.__setattr__(prop, props.get(prop, [ ]))

    def _parse_properties(self, item):

        props = { }
        for category, value in zip(item.pop("category", "").split("::"), item.pop("value", "").split("::")):
            if category not in props:
                props[category] = [ ]
            props[category].append(value)
        return props

    @classmethod
    def _update_properties(cls, cursor, item):

        recording_id, filename = item.get("recording_id"), item.get("filename")
        for prop in cls.PROPERTIES:

            delete = "delete from property where recording_id=? and filename=? and category=?"
            cursor.execute(delete, [ recording_id, filename, prop ])

            insert = "insert into property (recording_id, filename, category, value) values (?, ?, ?, ?)"
            values = [ (recording_id, filename, prop, value) for value in item.pop(prop, [ ]) if value ]
            cursor.executemany(insert, values)
