from logging.handlers import QueueHandler
from datetime import datetime
import traceback
import json

class LogViewQueue(QueueHandler):

    def __init__(self, queue):

        super().__init__(queue)
        self.websockets = set()

    def enqueue(self, record):

        if self.queue.full():
            self.queue.get()
        self.queue.put(record)

    def prepare(self, record):
        return json.dumps({
            "timestamp": datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S.%f"),
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
            "traceback": traceback.format_exc() if record.exc_info is not None else None,
        })
