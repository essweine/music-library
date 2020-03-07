#!/usr/bin/env python
import os

from tornado.httpserver import HTTPServer
from tornado.options import define, options
from tornado.ioloop import IOLoop, PeriodicCallback

from application import create_app

define("port", default = 80, help = "listen port")
define("root", default = "data", help = "root directory containing audio files")
define("db", default = os.path.join(os.path.dirname(__file__), "music.db"), help = "library database")

settings = {
    "debug": True,
    "template_path": os.path.join(os.path.dirname(__file__), "application", "templates"),
    "static_path": os.path.join(os.path.dirname(__file__), "application", "static"),
}

def print_options(options):
    print("Listening on port {port}".format(port = options.port))
    print("Root directory is {root}".format(root = options.root))
    print("Database is {db}".format(db = options.db))

def main():

    "Webserver for music application"

    app = create_app(settings)
    options.parse_command_line()
    print_options(options)
    http_server = HTTPServer(app)
    http_server.listen(options.port)
    app.init_db(options.db)
    app.set_root_directory(options.root)
    PeriodicCallback(app.update_state, 3000).start()
    IOLoop.current().start()

if __name__ == "__main__":
    main()
