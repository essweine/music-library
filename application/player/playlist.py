from random import shuffle, choice

from ..util import BaseObject

class Playlist(BaseObject):

    def __init__(self, **state):

        self.shuffled = state.get("shuffled", False)
        self.repeat = state.get("repeat", False)
        self.preview = state.get("preview", None)
        self.entries = state.get("entries", [ ])
        self.position = state.get("position", 0)

        self._shuffle_position = 0
        self._shuffle_order = [ ]

    @property
    def current_entry(self):
        return self.entries[self.position]

    @property
    def at_end(self):
        return self._shuffle_position == len(self._shuffle_order)

    def set_position(self):
        self.position = self._shuffle_order[self._shuffle_position] if len(self._shuffle_order) else 0

    def advance(self):

        self._shuffle_position = self._shuffle_position + 1
        if self.repeat and self.at_end:
            self._shuffle_position = 0

    def clear(self):

        self.entries.clear()
        self.position = 0
        self.preview = None
        self._shuffle_position = 0
        self._shuffle_order = [ ]

    def shuffle(self):

        if self.shuffled:
            self._shuffle_order = list(range(len(self._shuffle_order)))
            self._shuffle_position = self.position
        else:
            if len(self._shuffle_order):
                self._shuffle_position = self._shuffle_order.index(self.position)
            shuffle(self._shuffle_order)
        self.shuffled = not self.shuffled

    def move(self, task):

        entry = self.entries.pop(task.original)
        self.entries.insert(task.destination, entry)
        if self.position == task.original:
            self._move_current_entry(task.destination)
        if self.position == task.destination:
            self._move_current_entry(task.original)

    def _move_current_entry(self, destination):

        if self.shuffled:
            original = self._shuffle_order[self._shuffle_position]
            idx = self._shuffle_order.index(destination)
            self._shuffle_order[idx] = original
            self._shuffle_order[self._shuffle_position] = destination
        else:
            self._shuffle_position = destination

    def add(self, task, duration):

        if self.preview is None:
            entry = PlaylistEntry(task.filename, info = task.info, duration = duration)
            position = task.position if task.position is not None else len(self.entries)
            self.entries.insert(position, entry)

            if self.shuffled:
                self._shuffle_order = list(map(lambda v: v + 1 if v >= position else v, self._shuffle_order))
                idx = choice(list(range(self._shuffle_position, len(self._shuffle_order) + 1)))
                self._shuffle_order.insert(idx, position)
            else:
                if position <= self._shuffle_position and len(self._shuffle_order) > 0:
                    self._shuffle_position = self._shuffle_position + 1
                self._shuffle_order.append(len(self._shuffle_order))

    def remove(self, task):

        if task.position < len(self.entries):
            self.entries.pop(task.position)
            if self._shuffle_position > 0 and task.position < self._shuffle_position:
                self._shuffle_position = self._shuffle_position - 1
            self._shuffle_order.remove(task.position)
            self._shuffle_order = list(map(lambda v: v - 1 if v > task.position else v, self._shuffle_order))

    def skip(self, task):

        position = self._shuffle_position + task.offset
        if position >= 0 and position < len(self._shuffle_order):
            self._shuffle_position = position
        elif position < 0 and self.repeat:
            self._shuffle_position = len(self._shuffle_order) - 1
        elif position >= len(self._shuffle_order) and self.repeat:
            self._shuffle_position = 0

class PlaylistEntry(BaseObject):

    def __init__(self, filename, **entry):

        self.filename = filename
        self.duration = entry.get("duration", 0)
        self.info = entry.get("info", { })

