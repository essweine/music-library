from sqlite3 import Row

class JoinedView(object):

    def __init__(self, name, subqueries, aggregation = None):

        self.name        = name
        self.subqueries  = subqueries
        self.aggregation = aggregation

    def initialize(self, cursor):

        sq1, sq2 = self.subqueries
        select1, select2 = self._build_subquery(sq1), self._build_subquery(sq2)

        sq1_cols = [ name for (name, definition) in sq1.columns ]
        sq2_cols = [ name for (name, definition) in sq2.columns ]
        join_cols = [ name for name in sq1_cols if name in sq2_cols ]
        columns = sq1_cols + [ name for name in sq2_cols if name not in sq1_cols ]

        if self.aggregation is not None:
            for name, definition in self.aggregation.columns:
                idx = columns.index(name)
                columns.remove(name)
                columns.insert(idx, f"{definition} as {name}")
            if self.aggregation.group in join_cols:
                aggregation = f"group by sq1.{self.aggregation.group}"
            else:
                aggregation = f"group by {self.aggregation.group}"
        else:
            aggregation = ""

        stmt = "create view if not exists {name} as select {cols} from ({s1}) as sq1 left join ({s2}) as sq2 on {on} {agg}".format(
            name = self.name,
            cols = ", ".join([ f"sq1.{name}" if name in join_cols else name for name in columns ]),
            s1 = select1,
            s2 = select2,
            on = ", ".join([ f"sq1.{name}=sq2.{name}" for name in join_cols ]),
            agg = aggregation,
        )
        cursor.execute(stmt)

    def get_all(self, cursor, row_factory = Row, order = None):

        cursor.row_factory = row_factory
        order = f"order by {order}" if order else ""
        cursor.execute(f"select * from {self.name} {order}")

    def _build_subquery(self, subquery):

        column = lambda definition, name: f"{definition} as {name}" if definition else name
        return "select {distinct} {columns} from {source}".format(
            distinct = "distinct" if subquery.distinct else "",
            columns = ", ".join([ column(definition, name) for name, definition in subquery.columns ]),
            source = subquery.table.name,
        )

