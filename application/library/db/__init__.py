from collections import namedtuple

Column = namedtuple('Column', [ 'name', 'type', 'updateable', 'indexed' ])

from .source import Table, JoinedView
from .item import ItemCreator, ItemTable
from .query import Query
from .search import Search
