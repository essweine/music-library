import re
from ...util import BaseObject

class ItemCreator(object):
    """This class provides basic functionalty for converting table/view rows into objects."""

    def __init_subclass__(cls):

        if "item_type" not in cls.__dict__:
            raise Exception("Missing attribute: item_type")
        if "props" not in cls.__dict__:
            cls.props = [ ]
        cls.ItemType = type(cls.item_type, (BaseObject, ), { })
        super().__init_subclass__()

    @classmethod
    def create_item(cls, **item_attrs):

        item = cls.ItemType()
        for prop in cls.props:
            val = item_attrs.pop(prop, None)
            item.__setattr__(prop, val.split("::") if val else [ ])
        for attr, val in item_attrs.items():
            item.__setattr__(attr, val)
        return item

    @classmethod
    def new_item(cls):

        if "columns" in cls.__dict__:
            attrs = [ col.name for col in cls.columns ]
        elif "subqueries" in cls.__dict__:
            sq1_cols, sq2_cols = (cls.subqueries[0].select, cls.subqueries[1].select)
            attrs = list(set([ col[0] for col in sq1_cols ] + [ col[0] for col in sq2_cols ]))
        return cls.create_item(**dict([ (attr, None) for attr in attrs ]))

    @classmethod
    def get_all(cls, cursor, sort_col = None):

        cursor.row_factory = cls.row_factory
        order = f"order by {sort_col}" if sort_col else ""
        cursor.execute(f"select * from {cls.name} {order}")

    @classmethod
    def row_factory(cls, cursor, row):
        return cls.create_item(**dict([ (col[0], row[idx]) for idx, col in enumerate(cursor.description) ]))

class Table(object):
    """Generic table functionality"""

    def __init_subclass__(cls):

        required_attrs = [ "name", "columns" ]
        if not all([ attr in cls.__dict__ for attr in required_attrs ]):
            raise Exception(", ".join(required_attrs) + " are required to create a Table")
        super().__init_subclass__()

    @classmethod
    def initialize(cls, cursor):

        columns, col_defs = zip(*[ (col.name, col.type) for col in cls.columns ])
        table_def = ", ".join([ "{0} {1}".format(col, col_def) for col, col_def in zip(columns, col_defs) ])
        cursor.execute(f"create table if not exists {cls.name} ({table_def})")
        for col in filter(lambda col: col.indexed, cls.columns):
            cursor.execute(f"create index if not exists {cls.name}_{col.name} on {cls.name} ({col.name})")

    @classmethod
    def insert(cls, cursor, data):

        cls._convert_empty_strings(data)
        values = [ data.get(col.name) for col in cls.columns ]
        columns, placeholders = zip(*[ (col.name, "?") for col in cls.columns ])
        cursor.execute(f"insert into {cls.name} ({','.join(columns)}) values ({','.join(placeholders)})", values)

    @classmethod
    def delete_where(cls, cursor, conditions):

        columns, values = zip(*[ (col, val) for col, val in conditions.items() ])
        stmt = "delete from {table} where {conditions}".format(
            table = cls.name,
            conditions = " and ".join([ f"{col}=?" for col in columns ]),
        )
        cursor.execute(stmt, values)

    @classmethod
    def drop(cls, cursor):
        cursor.execute(f"drop table if exists {cls.name}")

    @classmethod
    def _convert_empty_strings(cls, data):
        for column in cls.columns:
            if column.name in data and data[column.name] == "":
                data[column.name] = None

class ItemTable(object):
    """This class provides extra functionality for tables containing items with ids."""

    def __init_subclass__(cls):

        if "identifier_col" not in cls.__dict__:
            raise Exception("Missing attribute: identifier_col")
        super().__init_subclass__()

    @classmethod
    def get(cls, cursor, item_id):

        cursor.row_factory = cls.row_factory
        cursor.execute(f"select * from {cls.name} where {cls.identifier_col}=?", (item_id, ))
        return cursor.fetchone()

    @classmethod
    def create(cls, cursor, item):
        cls.insert(cursor, item)

    @classmethod
    def update(cls, cursor, item):

        cls._convert_empty_strings(item)
        values = [ item.get(col.name) for col in cls.columns if col.updateable ] + [ item.get(cls.identifier_col) ]
        updates = ", ".join([ "{0}=?".format(col.name) for col in cls.columns if col.updateable ])
        cursor.execute(f"update {cls.name} set {updates} where {cls.identifier_col}=?", values)

    @classmethod
    def set_rating(cls, cursor, rating):
        cursor.execute(f"update {cls.name} set rating=? where {cls.identifier_col}=?", (rating.value, rating.item_id))

    @classmethod
    def delete(cls, cursor, item_id):
        cursor.execute(f"delete from {cls.name} where {cls.identifier_col}=?", (item_id, ))

class JoinedView(type):
    """Generic view functionality"""

    def __init_subclass__(cls):

        required_attrs = [ "name", "subqueries" ]
        if not all([ attr in cls.__dict__ for attr in required_attrs ]):
            raise Exception(", ".join(required_attrs) + " are required to create a JoinedView")
        super().__init_subclass__()

    @classmethod
    def initialize(cls, cursor):

        sq1, sq2 = cls.subqueries
        sq1_cols = [ name for (name, definition) in sq1.select ]
        sq2_cols = [ name for (name, definition) in sq2.select ]
        join_cols = [ name for name in sq1_cols if name in sq2_cols ]
        columns = sq1_cols + [ name for name in sq2_cols if name not in sq1_cols ]

        stmt = "create view if not exists {name} as select {cols} from ({s1}) as sq1 left join ({s2}) as sq2 on {on}".format(
            name = cls.name,
            cols = ", ".join([ f"sq1.{name}" if name in join_cols else name for name in columns ]),
            s1 = sq1,
            s2 = sq2,
            on = ", ".join([ f"sq1.{name}=sq2.{name}" for name in join_cols ]),
        )
        cursor.execute(stmt)

    @classmethod
    def drop(cls, cursor):
        cursor.execute(f"drop view if exists {cls.name}")

