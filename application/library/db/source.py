import re

class Table(object):

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

class JoinedView(type):

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

