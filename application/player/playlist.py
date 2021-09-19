from random import shuffle, choice

from ..util import BaseObject

class Playlist(BaseObject):

    def __init__(self, **state):

        self.shuffled = state.get("shuffled", False)
        self.repeat = state.get("repeat", False)
        self.preview = state.get("preview", None)
        self.entries = state.get("entries", [ ])
        self.position = state.get("position", 0)

        self._order_position = 0
        self._current_order = [ ]

    @property
    def current_entry(self):
        self.set_position()
        return self.entries[self.position]

    @property
    def at_end(self):
        return len(self.entries) == 0 or self._order_position == len(self._current_order)

    def set_position(self):
        self.position = self._current_order[self._order_position] if len(self._current_order) else 0

    def reset(self):

        self._order_position = 0
        self.set_position()

    def advance(self):

        self._order_position = self._order_position + 1
        if self.repeat and self.at_end:
            self._order_position = 0

    def clear(self):

        self.entries.clear()
        self.position = 0
        self.preview = None
        self._order_position = 0
        self._current_order = [ ]

    def shuffle(self):

        if self.shuffled:
            self._current_order = list(range(len(self._current_order)))
            self._order_position = self.position
        else:
            if len(self._current_order):
                self._order_position = self._current_order.index(self.position)
            shuffle(self._current_order)
        self.shuffled = not self.shuffled

    def move(self, original, destination):

        entry = self.entries.pop(original)
        self.entries.insert(destination, entry)
        if self.position == original:
            self._move_current_entry(destination)
        if self.position == destination:
            self._move_current_entry(original)
        self.set_position()

    def _move_current_entry(self, destination):

        if self.shuffled:
            original = self._current_order[self._order_position]
            idx = self._current_order.index(destination)
            self._current_order[idx] = original
            self._current_order[self._order_position] = destination
        else:
            self._order_position = destination

    def add(self, entry, position = None):

        if position is None:
            position = len(self.entries)

        self.entries.insert(position, entry)

        if self.shuffled:
            self._current_order = list(map(lambda v: v + 1 if v >= position else v, self._current_order))
            idx = choice(list(range(self._order_position, len(self._current_order) + 1)))
            self._current_order.insert(idx, position)
        else:
            if position <= self._order_position and len(self._current_order) > 0:
                self._order_position = self._order_position + 1
            self._current_order.append(len(self._current_order))

        self.set_position()

    def remove(self, position):

        if position < len(self.entries):
            self.entries.pop(position)
            if self._order_position > 0 and position < self._order_position:
                self._order_position = self._order_position - 1
            self._current_order.remove(position)
            self._current_order = list(map(lambda v: v - 1 if v > position else v, self._current_order))
        self.set_position()

    def skip(self, offset):

        position = self._order_position + offset
        if position >= 0 and position < len(self._current_order):
            self._order_position = position
        elif position < 0 and self.repeat:
            self._order_position = len(self._current_order) - 1
        elif position >= len(self._current_order) and self.repeat:
            self._order_position = 0
        self.set_position()

class PlaylistEntry(BaseObject):

    def __init__(self, filename, duration):

        self.filename = filename
        self.duration = duration

