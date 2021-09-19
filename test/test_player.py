import unittest
import sqlite3
import os, signal
import sys
import time

from uuid import uuid4
from datetime import date

from application.library import TABLES, VIEWS
from application.importer import DirectoryService
from application.library import LibrarySearchView
from application.player import player
from application.player.state import Task
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestPlayer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)

        cls.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)
        cursor = cls.conn.cursor()
        for item in TABLES + VIEWS:
            item.initialize(cursor)
        cls.conn.commit()

        directory = cls.directory_service.get_directory("root/Keep It Like A Secret")
        cls.recording = cls.directory_service.create_recording(directory, directory.text[0])
        LibrarySearchView.create_recording(cursor, cls.recording.serialize())

        cursor.close()

        cls.station = { "name": "Viva la Voce", "website": "", "url": "https://16803.live.streamtheworld.com/WETAVLV.mp3" }

        player.FFMPEG = [ os.path.join(ROOT_PATH, "mock_play"), "5" ]
        cls.player = player.Player(ROOT_PATH)

    @classmethod
    def tearDownClass(cls):

        cls.player.execute(Task(name = "stop"))
        cls.conn.close()
        os.remove(DB_NAME)

    def execute(self, task):

        self.player.execute(Task(**task))
        return self.player.state

    def check_state(self):

        cursor = self.conn.cursor()
        self.player.check_state(cursor)
        cursor.close()
        return self.player.state

    def test_001_add_items_to_playlist(self):

        task = { "name": "add", "position": None, "filenames": [ track.filename for track in self.recording.tracks ] }
        state = self.execute(task)
        self.assertEqual(len(state.playlist.entries), len(self.recording.tracks))

    def test_002_start(self):

        state = self.execute({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 0)

    def test_003_skip(self):

        forward = { "name": "skip", "offset": 2 }
        state = self.execute(forward)
        self.assertEqual(state.playlist.position, 2)
        back = { "name": "skip", "offset": -1 }
        state = self.execute(back)
        self.assertEqual(state.playlist.position, 1)
        self.assertEqual(state.proc_state.value, "playing")

    def test_004_pause(self):

        state = self.execute({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.playlist.position, 1)
        state = self.execute({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 1)

    def test_005_seek(self):

        state = self.execute({ "name": "seek", "time": 3000 })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current.elapsed, 3000)

    def test_006_stop(self):

        state = self.execute({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.playlist.position, 1)
        state = self.execute({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 1)

    def test_007_advance(self):

        wait = 1 + int(self.player.state.current.duration / 1000)
        sys.stdout.write(f"\nWaiting {wait}s for player to advance...\n")
        time.sleep(wait)
        state = self.check_state()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 2)

    def test_008_stop_at_end(self):

        wait = 1 + int(self.player.state.current.duration / 1000)
        sys.stdout.write(f"\nWaiting {wait}s for player to stop...\n")
        time.sleep(wait)
        state = self.check_state()
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.playlist.position, 0)

    def test_009_repeat(self):

        state = self.execute({ "name": "skip", "offset": 2 })
        state = self.execute({ "name": "start" })
        state = self.execute({ "name": "repeat" })
        self.assertEqual(state.playlist.repeat, True)

        wait = 1 + int(self.player.state.current.duration / 1000)
        sys.stdout.write(f"\nWaiting {wait}s for player to advance...\n")
        time.sleep(wait)

        state = self.check_state()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 0)

        state = self.execute({ "name":"skip", "offset": -1 })
        self.assertEqual(state.playlist.position, 2)

        state = self.execute({ "name":"skip", "offset": 1 })
        self.assertEqual(state.playlist.position, 0)

        state = self.execute({ "name": "repeat" })
        self.assertEqual(state.playlist.repeat, False)

    def test_010_move(self):

        state = self.execute({ "name": "move", "original": 2, "destination": 1 })
        self.assertEqual(state.playlist.entries[1].filename, self.recording.tracks[2].filename)

    def test_011_remove(self):

        state = self.execute({ "name": "remove", "position": 1 })
        self.assertEqual(len(state.playlist.entries), 2)
        self.assertNotIn(self.recording.tracks[2].filename, [ track.filename for track in state.playlist.entries ])

    def test_012_stream(self):

        task = { "name": "stream", "url": self.station["url"], "info": self.station }
        state = self.execute(task)
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.mode.value, "stream")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.execute({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.execute({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.execute({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.mode.value, "playlist")

    def test_013_preview(self):

        directory = self.directory_service.get_directory("root/Edge of the Sun")
        self.directory_service.aggregate(directory)
        preview = { "name": "preview", "directory": directory.relative_path, "filenames": directory.audio }
        state = self.execute(preview)
        self.assertEqual(state.playlist.preview, directory.relative_path)
        self.assertEqual(len(state.playlist.entries), 6)
        self.assertEqual(state.playlist.entries[0].filename, directory.audio[0])

        recording = self.directory_service.get_directory("root/Keep It Like A Secret")
        add = { "name": "add", "filename": recording.audio[0], "position": None, "info": { "title": "unknown", "artist": [ ] } }
        state = self.execute(add)
        self.assertEqual(len(state.playlist.entries), 6)
        self.assertEqual(state.playlist.entries[-1].filename, directory.audio[-1])

        state = self.execute({ "name": "start" })
        state = self.execute({ "name": "clear" })
        self.assertEqual(state.playlist.preview, None)
