from collections import namedtuple

Column = namedtuple('Column', [ 'name', 'type', 'updateable', 'indexed' ])
Subquery = namedtuple('Subquery', [ 'columns', 'table', 'distinct' ])
Aggregation = namedtuple('Aggregation', [ 'columns', 'group' ])

from .table import Table, ItemTable
from .view import JoinedView
from .query import Query
