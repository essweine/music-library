import unittest
import os
from datetime import datetime

from mutagen.flac import FLAC

from application.importer import DirectoryService
from application.importer.parsed_text import ParsedText
from . import ROOT_PATH, DEFAULT_INDEX, COMPLETE_INDEX

class TestDirectoryService(unittest.TestCase):

    def setUp(self):
        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)

    def test_001_index(self):

        self.assertEqual(len(self.directory_service.list_all()), 6)
        self.directory_service.remove("root/Keep It Like A Secret")
        self.assertEqual(len(self.directory_service.list_all()), 5)
        self.directory_service.remove("root/Edge of the Sun/Images")
        self.assertEqual(len(self.directory_service.list_all()), 4)
        self.directory_service.remove("root/Edge of the Sun")
        self.assertEqual(len(self.directory_service.list_all()), 0)

    def test_002_directory_info(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        self.assertEqual(len(directory.children), 0)
        self.assertEqual(len(directory.audio), 3)
        self.assertEqual(len(directory.images), 2)
        self.assertEqual(len(directory.text), 1)

    def test_003_aggregate(self):

        directory = self.directory_service.get_directory("root/Edge of the Sun")
        self.assertEqual(len(directory.children), 3)
        self.assertEqual(len(directory.audio), 0)
        self.assertEqual(len(directory.images), 0)
        self.assertEqual(len(directory.text), 1)

        self.directory_service.aggregate(directory)
        self.assertEqual(len(directory.children), 0)
        self.assertEqual(len(directory.audio), 6)
        self.assertEqual(len(directory.images), 2)
        self.assertEqual(len(directory.text), 1)

    def test_004_create_recording(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        self.assertEqual(recording.directory, directory.relative_path)
        self.assertEqual(recording.title, "Keep It Like a Secret")
        self.assertEqual(recording.artist[0], "Built to Spill")
        self.assertEqual(recording.notes, directory.text[0])
        self.assertEqual(len(recording.tracks), len(directory.audio))
        self.assertEqual(recording.tracks[0].title, "The Plan")

class TestDirectoryServiceIndex(unittest.TestCase):

    def test_001_complete_index(self):

        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX + COMPLETE_INDEX)
        self.assertEqual(len(self.directory_service.list_all()), 0)

    def test_002_partial_index(self):

        indexed = [ "root/Edge of the Sun" ]
        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX + indexed)
        self.assertEqual(len(self.directory_service.list_all()), 2)

class TestParsedText(unittest.TestCase):

    def test_001_parse_recording_data(self):

        with open("test/data/root/Keep It Like A Secret/info.txt", "rb") as text:
            parsed = ParsedText(text)

        self.assertEqual(parsed.artist[0], "Built to Spill")
        self.assertEqual(parsed.title, "Keep It Like a Secret")
        self.assertEqual(parsed.recording_date, "1999-02-02")
        self.assertEqual(len(parsed.track_titles), 10)

    def test_002_parse_timed_tracks(self):

        with open("test/data/text/timed_tracks.txt", "rb") as text:
            parsed = ParsedText(text)
        self.assertEqual(len(parsed.track_titles), 10)

    def test_003_parse_tracks_heading(self):

        with open("test/data/text/tracks_with_heading.txt", "rb") as text:
            parsed = ParsedText(text)
        self.assertEqual(len(parsed.track_titles), 18)

class TestTags(unittest.TestCase):

    def test_001_set_tags(self):

        directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX + COMPLETE_INDEX)
        directory = directory_service.get_directory("root/Keep It Like A Secret")
        textfile = "root/Keep It Like A Secret/info.txt"
        recording = directory_service.create_recording(directory, textfile)
        recording.recording_date = datetime.strptime(recording.recording_date, "%Y-%m-%d")
        errors = directory_service.write_tags(recording)
        self.assertEqual(len(errors), 0)

        for idx, filename in enumerate(directory.audio):
            audio = FLAC(os.path.join(ROOT_PATH, filename))
            self.assertListEqual(audio["ARTIST"], recording.artist)
            self.assertEqual(audio["TITLE"][0], recording.tracks[idx].title)
            self.assertEqual(audio["ALBUM"][0], recording.title)
            self.assertEqual(audio["TRACKNUMBER"][0], str(idx + 1))
            self.assertEqual(audio["TRACKTOTAL"][0], str(len(directory.audio)))
            self.assertEqual(audio["DATE"][0], str(recording.recording_date.year))
