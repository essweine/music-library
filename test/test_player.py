import unittest
import sqlite3
import os, signal
import sys

from uuid import uuid4
from datetime import date

from application.library import TABLES, VIEWS
from application.importer import DirectoryService
from application.library import LibrarySearchView
from application.player import player
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

        cls.player.send_task({ "name": "stop" })
        while cls.player.conn.poll():
            cls.player.conn.recv()
        cls.player._process.kill()
        cls.conn.close()
        os.remove(DB_NAME)

    def send_task(self, task):

        self.player.send_task(task)
        return self.player.conn.recv()

    def test_001_add_items_to_playlist(self):

        for idx, track in enumerate(self.recording.tracks):
            task = { "name": "add", "position": None, "filename": track.filename, "info": track.serialize() }
            state = self.send_task(task)
            self.assertEqual(len(state.playlist.entries), idx + 1)

    def test_002_start(self):

        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 0)

    def test_003_skip(self):

        forward = { "name": "skip", "offset": 2 }
        state = self.send_task(forward)
        self.assertEqual(state.playlist.position, 2)
        self.assertEqual(state.previous.info["filename"], self.recording.tracks[0].filename)
        back = { "name": "skip", "offset": -1 }
        state = self.send_task(back)
        self.assertEqual(state.playlist.position, 1)
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.previous.info["filename"], self.recording.tracks[2].filename)

    def test_004_pause(self):

        state = self.send_task({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.playlist.position, 1)
        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 1)

    def test_005_seek(self):

        state = self.send_task({ "name": "seek", "time": 3000 })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current.elapsed, 3000)
        self.assertEqual(state.previous, None)

    def test_006_stop(self):

        state = self.send_task({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.playlist.position, 1)
        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 1)

    def test_007_advance(self):

        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 2)
        self.assertEqual(state.previous.info["filename"], state.playlist.entries[1].filename)
        self.assertNotEqual(state.previous.start_time, None)
        self.assertNotEqual(state.previous.end_time, None)

    def test_008_stop_at_end(self):

        sys.stdout.write("\nWaiting for player to stop\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.playlist.position, 0)

    def test_009_repeat(self):

        state = self.send_task({ "name": "skip", "offset": 2 })
        state = self.send_task({ "name": "start" })
        state = self.send_task({ "name": "repeat" })
        self.assertEqual(state.playlist.repeat, True)

        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.playlist.position, 0)

        state = self.send_task({ "name":"skip", "offset": -1 })
        self.assertEqual(state.playlist.position, 2)

        state = self.send_task({ "name":"skip", "offset": 1 })
        self.assertEqual(state.playlist.position, 0)

        state = self.send_task({ "name": "repeat" })
        self.assertEqual(state.playlist.repeat, False)

    def test_010_move(self):

        state = self.send_task({ "name": "move", "original": 2, "destination": 1 })
        self.assertEqual(state.playlist.entries[1].filename, self.recording.tracks[2].filename)

    def test_011_remove(self):

        state = self.send_task({ "name": "remove", "position": 1 })
        self.assertEqual(len(state.playlist.entries), 2)
        self.assertNotIn(self.recording.tracks[2].filename, [ track.filename for track in state.playlist.entries ])

    def test_012_stream(self):

        task = { "name": "stream", "url": self.station["url"], "info": self.station }
        state = self.send_task(task)
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.mode.value, "stream")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.send_task({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current.url, self.station["url"])

        state = self.send_task({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.mode.value, "playlist")
        self.assertEqual(state.previous.url, self.station["url"])
        self.assertNotEqual(state.previous.start_time, None)
        self.assertNotEqual(state.previous.end_time, None)

    def test_013_preview(self):

        directory = self.directory_service.get_directory("root/Edge of the Sun")
        self.directory_service.aggregate(directory)
        preview = { "name": "preview", "directory": directory.relative_path, "filenames": directory.audio }
        state = self.send_task(preview)
        self.assertEqual(state.playlist.preview, directory.relative_path)
        self.assertEqual(len(state.playlist.entries), 6)
        self.assertEqual(state.playlist.entries[0].filename, directory.audio[0])

        original = self.directory_service.get_directory("root/Keep It Like A Secret")
        add = { "name": "add", "filename": original.audio[0], "position": None, "info": { "title": "unknown", "artist": [ ] } }
        self.player.send_task(add)
        state_changed = self.player.conn.poll(1)
        self.assertEqual(state_changed, True)
        self.assertEqual(len(state.playlist.entries), 6)
        self.assertEqual(state.playlist.entries[-1].filename, directory.audio[-1])

        state = self.send_task({ "name": "start" })
        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()

        state = self.send_task({ "name": "clear" })
        self.assertEqual(state.playlist.preview, None)
