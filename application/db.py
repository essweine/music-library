from collections import namedtuple

Column = namedtuple('Column', [ 'name', 'type', 'default', 'updateable' ])

def table_definition(table, COLUMNS):

    col_def = lambda col: col.type if col.default is None else "{0} default {1}".format(col.type, col.default)
    columns, col_defs = zip(*[ (col.name, col_def(col)) for col in COLUMNS ])
    return "create table if not exists {table} ({table_def})".format(
        table = table,
        table_def = ", ".join([ "{0} {1}".format(col, col_def) for col, col_def in zip(columns, col_defs) ]),
    )

def insert_statement(table, COLUMNS):

    columns, placeholders = zip(*[ (col.name, "?") for col in COLUMNS ])
    return "insert into {table} ({columns}) values ({placeholders})".format(
        table = table,
        columns = ", ".join(columns),
        placeholders = ", ".join(placeholders),
    )

def update_statement(table, key, COLUMNS):

    updates = ", ".join([ "{0}=?".format(col.name) for col in COLUMNS if col.updateable ])
    return "update {table} set {updates} where {key}=?".format(
        table = table,
        updates = updates,
        key = key,
    )

def convert_empty_strings(data, COLUMNS):

    for column in COLUMNS:
        if column.name in data and data[column.name] == "":
            data[column.name] = None
