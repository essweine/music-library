from .directory_service import DirectoryService
from .import_handler import ImportHandler, ImportRootHandler

IMPORT_HANDLERS = [ 
    (r"/api/importer/(.*)", ImportHandler),
    (r"/api/importer", ImportRootHandler),
]
