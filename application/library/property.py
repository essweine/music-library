import re

from ..util.db import Column, Subquery, Aggregation, Table
from ..util import BaseObject

PROPERTY_COLUMNS = [
    Column("recording_id", "text", False, True),
    Column("filename", "text", False, True),
    Column("category", "text", True, True),
    Column("value", "text", True, True),
]
PropertyTable = Table("property", PROPERTY_COLUMNS)

TRACK_PROPS = Subquery([
    ("filename", None),
    ("category", None),
    ("value", None),
], PropertyTable, False)

TRACK_AGGREGATE = Aggregation([
    ("category", "group_concat(category, '::')"), 
    ("value", "group_concat(value, '::')"),
], "filename")

class PropertyView(BaseObject):

    def __init__(self, prop_name, aggregate):

        self.name = prop_name
        self.aggregate = aggregate

    def initialize(self, cursor):

        category = re.sub("'", "''", self.name)
        subquery = f"select distinct {self.aggregate}, value from property where category='{category}'"
        columns = ", ".join([ self.aggregate, "group_concat(value, '::') as value" ])
        stmt = f"create view if not exists {self.name} as select {columns} from ({subquery}) group by {self.aggregate}"
        cursor.execute(stmt)

class PropertyAggregate(BaseObject):

    def __init__(self, item):

        props = self._parse_properties(item)
        for prop in self.PROPERTIES:
            self.__setattr__(prop, props.get(prop, [ ]))

    def _parse_properties(self, item):

        props = { }
        categories, values = item.pop("category", None), item.pop("value", None)
        if categories and values:
            for category, value in zip(categories.split("::"), values.split("::")):
                if category not in props:
                    props[category] = [ ]
                props[category].append(value)
        return props

    @classmethod
    def _update_properties(cls, cursor, item):

        recording_id, filename = item.get("recording_id"), item.get("filename")
        for prop in cls.PROPERTIES:
            category = { "recording_id": recording_id, "filename": filename, "category": prop }
            PropertyTable.delete_where(cursor, category)
            for value in item.pop(prop, [ ]):
                category.update({ "value": value })
                PropertyTable.insert(cursor, category)

