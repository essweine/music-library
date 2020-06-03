import os, re, json

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler

from ..util import BaseRequestHandler, BaseApiHandler

class LogDisplayHandler(BaseRequestHandler):

    def get(self):

        self.render("player.html", script = "log.js")

class LogNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.console.websockets.add(self)

    def on_close(self):
        self.application.console.websockets.remove(self)

    def on_message(self, message):
        pass
