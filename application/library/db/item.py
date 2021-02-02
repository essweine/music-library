from ...util import BaseObject

class ItemCreator(object):
    """This class provides basic functionalty for convert table/view rows into objects."""

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

class ItemTable(object):
    """This class provides extra functionality for creating objects from tables."""

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

