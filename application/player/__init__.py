from .player import Player
from .player_handler import PlayerHandler, PlayerDisplayHandler, PlayerNotificationHandler

PLAYER_HANDLERS = [
    (r"/api/player/notifications", PlayerNotificationHandler),
    (r"/api/player", PlayerHandler),
]
