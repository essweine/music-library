import unittest
import sqlite3
import os, signal
import sys

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording, Station
from application.player import player
from application.config import TABLES, VIEWS
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
        Recording.create(cursor, cls.recording.as_dict())

        cursor.close()

        cls.station = { "name": "Viva la Voce", "website": "", "url": "https://16803.live.streamtheworld.com/WETAVLV.mp3" }

        player.CMD = [ os.path.join(ROOT_PATH, "mock_play"), "5" ]
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
            task = { "name": "add", "position": None, "filename": track.filename }
            state = self.send_task(task)
            self.assertEqual(len(state.playlist), idx + 1)

    def test_002_start(self):

        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current, 0)

    def test_003_skip(self):

        forward = { "name": "skip", "offset": 2 }
        state = self.send_task(forward)
        self.assertEqual(state.current, 2)

        back = { "name": "skip", "offset": -1 }
        state = self.send_task(back)
        self.assertEqual(state.current, 1)

        self.assertEqual(state.proc_state.value, "playing")

    def test_004_pause(self):

        state = self.send_task({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.current, 1)
        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current, 1)

    def test_005_stop(self):

        state = self.send_task({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.current, 1)
        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current, 1)

    def test_006_advance(self):

        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current, 2)
        self.assertEqual(len(state.history), 1)
        self.assertNotEqual(state.history[0].start_time, None)
        self.assertNotEqual(state.history[0].end_time, None)

    def test_008_stop_at_end(self):

        sys.stdout.write("\nWaiting for player to stop\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.current, 0)

    def test_009_repeat(self):

        state = self.send_task({ "name": "skip", "offset": 2 })
        state = self.send_task({ "name": "start" })
        state = self.send_task({ "name": "repeat" })
        self.assertEqual(state.repeat, True)

        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.current, 0)

        state = self.send_task({ "name": "skip", "offset": -1 })
        self.assertEqual(state.current, 2)

        state = self.send_task({ "name": "skip", "offset": 1 })
        self.assertEqual(state.current, 0)

        state = self.send_task({ "name": "repeat" })
        self.assertEqual(state.repeat, False)

    def test_010_move(self):

        state = self.send_task({ "name": "move", "original": 2, "destination": 1 })
        self.assertEqual(state.playlist[1].filename, self.recording.tracks[2].filename)

    def test_011_remove(self):

        state = self.send_task({ "name": "remove", "position": 1 })
        self.assertEqual(len(state.playlist), 2)
        self.assertNotIn(self.recording.tracks[2].filename, [ track.filename for track in state.playlist ])

    def test_012_stream(self):

        state = self.send_task({ "name": "stream", "url": self.station["url"] })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.stream.url, self.station["url"])

        state = self.send_task({ "name": "pause" })
        self.assertEqual(state.proc_state.value, "paused")
        self.assertEqual(state.stream.url, self.station["url"])

        state = self.send_task({ "name": "start" })
        self.assertEqual(state.proc_state.value, "playing")
        self.assertEqual(state.stream.url, self.station["url"])

        state = self.send_task({ "name": "stop" })
        self.assertEqual(state.proc_state.value, "stopped")
        self.assertEqual(state.stream, None)
        self.assertEqual(state.history[0].url, self.station["url"])
        self.assertNotEqual(state.history[0].start_time, None)
        self.assertNotEqual(state.history[0].end_time, None)

    def test_013_preview(self):

        directory = self.directory_service.get_directory("root/Edge of the Sun")
        self.directory_service.aggregate(directory)
        task = {
            "name": "preview",
            "directory": directory.relative_path,
            "filenames": directory.audio
        }
        state = self.send_task(task)
        self.assertEqual(state.preview, directory.relative_path)
        self.assertEqual(len(state.playlist), 6)
        self.assertEqual(state.playlist[0].filename, directory.audio[0])

        original = self.directory_service.get_directory("root/Keep It Like A Secret")
        self.player.send_task({ "name": "add", "filename": original.audio[0], "position": None })
        state_changed = self.player.conn.poll(1)
        self.assertEqual(state_changed, False)
        self.assertEqual(len(state.playlist), 6)
        self.assertEqual(state.playlist[-1].filename, directory.audio[-1])

        state = self.send_task({ "name": "start" })
        sys.stdout.write("\nWaiting for player to advance\n")
        state_changed = self.player.conn.poll(8)
        sys.stdout.write("\nDone waiting\n")
        self.assertEqual(state_changed, True)
        state = self.player.conn.recv()
        self.assertEqual(len(state.history), 0)

        state = self.send_task({ "name": "clear" })
        self.assertEqual(state.preview, None)

