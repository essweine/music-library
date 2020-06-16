import os, re, json

from tornado.websocket import WebSocketHandler

class LogNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.console.websockets.add(self)

    def on_close(self):
        self.application.console.websockets.remove(self)

    def on_message(self, message):
        pass
