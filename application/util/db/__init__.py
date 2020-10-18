from collections import namedtuple

Column = namedtuple('Column', [ 'name', 'type', 'updateable', 'indexed' ])
Subquery = namedtuple('Subquery', [ 'columns', 'source', 'distinct' ])
Aggregation = namedtuple('Aggregation', [ 'columns', 'group' ])

from .table import Table
from .view import View
from .query import Query
