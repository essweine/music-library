from . import config
from .music_library import MusicLibrary, handlers

def create_app(settings):
    return MusicLibrary(
        handlers,
        **settings
    )
