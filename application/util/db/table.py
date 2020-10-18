from sqlite3 import Row

class Table(object):

    def __init__(self, name, columns, identifier):

        self.name       = name
        self.columns    = columns
        self.identifier = identifier

    def initialize(self, cursor):

        columns, col_defs = zip(*[ (col.name, col.type) for col in self.columns ])
        table_def = ", ".join([ "{0} {1}".format(col, col_def) for col, col_def in zip(columns, col_defs) ])
        cursor.execute(f"create table if not exists {self.name} ({table_def})")
        for col in filter(lambda col: col.indexed, self.columns):
            cursor.execute(f"create index if not exists {self.name}_{col.name} on {self.name} ({col.name})")

    def get(self, cursor, item_id, row_factory = Row):

        cursor.row_factory = row_factory
        cursor.execute(f"select * from {self.name} where {self.identifier}=?", (item_id, ))

    def get_all(self, cursor, row_factory = Row):

        cursor.row_factory = row_factory
        cursor.execute(f"select * from {self.name}")

    def insert(self, cursor, data):

        self._convert_empty_strings(data)
        values = [ data.get(col.name) for col in self.columns ]
        columns, placeholders = zip(*[ (col.name, "?") for col in self.columns ])
        cursor.execute(f"insert into {self.name} ({','.join(columns)}) values ({','.join(placeholders)})", values)

    def update(self, cursor, data):

        self._convert_empty_strings(data)
        values = [ data.get(col.name) for col in self.columns if col.updateable ] + [ data.get(self.identifier) ]
        updates = ", ".join([ "{0}=?".format(col.name) for col in self.columns if col.updateable ])
        cursor.execute(f"update {self.name} set {updates} where {self.identifier}=?", values)

    def delete(self, cursor, item_id):

        cursor.execute(f"delete from {self.name} where {self.identifier}=?", (item_id, ))

    def _convert_empty_strings(self, data):

        for column in self.columns:
            if column.name in data and data[column.name] == "":
                data[column.name] = None

