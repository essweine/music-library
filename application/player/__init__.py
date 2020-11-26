from .player import Player
from .player_handler import PlayerHandler, PlayerDisplayHandler, PlayerNotificationHandler
from .history_handler import RecentlyPlayedHandler, FrequentlyPlayedHandler

PLAYER_HANDLERS = [
    (r"/api/player/notifications", PlayerNotificationHandler),
    (r"/api/player", PlayerHandler),
    (r"/api/history/recent", RecentlyPlayedHandler),
    (r"/api/history/frequent", FrequentlyPlayedHandler),
]
