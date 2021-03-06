from sqlite3 import Row
import re

class Query(object):

    def __init__(self, table, select = None, distinct = False, group = None, order = None, limit = None):

        self.table    = table
        self.select   = select
        self.distinct = distinct
        self.group    = group
        self.order    = order
        self.limit    = limit

        self.conditions, self.values = [ ], [ ]

    def compare(self, column, value, operator):

        self.conditions.append(f"{column} {operator} ?")
        self.values.append(value)
        return self

    def contains(self, column, value):

        self.conditions.append(f"{column} like ?")
        self.values.append(f"%{value}%")
        return self

    def compare_set(self, column, values, contained_in = True):

        op = "in" if contained_in else "not in"
        escape = lambda val: re.sub("'", "''", val)
        vals = ", ".join([ f"'{escape(val)}'" for val in values ])
        self.conditions.append(f"{column} {op} ({vals})")
        return self

    def compare_subquery(self, column, query, contained_in = True):

        op = "in" if contained_in else "not in"
        self.values.extend(query.values)
        self.conditions.append(f"{column} {op} ({query})")
        return self

    def execute(self, cursor, row_factory = Row):

        query = str(self)
        cursor.row_factory = row_factory
        cursor.execute(query, self.values)

    def __repr__(self):

        if self.select is not None:
            column = lambda definition, name: f"{definition} as {name}" if definition else name
            columns = [ column(definition, name) for name, definition in self.select ]
        else:
            columns = [ "*" ]

        select = ", ".join(columns)
        distinct = "distinct" if self.distinct else ""
        conditions = "where " + " and ".join([ cond for cond in self.conditions ]) if self.conditions else ""
        group = f"group by {self.group}" if self.group else ""
        order = f"order by {self.order}" if self.order else ""
        limit = f"limit {self.limit}" if self.limit is not None else ""
        return f"select {distinct} {select} from {self.table.name} {conditions} {group} {order} {limit}"


