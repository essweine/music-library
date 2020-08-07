import unittest
import os

from application.importer import DirectoryService

ROOT_PATH = os.path.join(os.path.dirname(__file__), "data")
DEFAULT_INDEX = [ "text" ]
COMPLETE_INDEX = [ "root/Keep It Like A Secret", "root/Edge of the Sun" ]

class TestDirectoryService(unittest.TestCase):

    def setUp(self):
        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)

    def test_index(self):

        self.assertEqual(len(self.directory_service.list_all()), 6)
        self.directory_service.remove("root/Keep It Like A Secret")
        self.assertEqual(len(self.directory_service.list_all()), 5)
        self.directory_service.remove("root/Edge of the Sun/Images")
        self.assertEqual(len(self.directory_service.list_all()), 4)
        self.directory_service.remove("root/Edge of the Sun")
        self.assertEqual(len(self.directory_service.list_all()), 0)

    def test_directory_info(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        self.assertEqual(len(directory.children), 0)
        self.assertEqual(len(directory.audio), 3)
        self.assertEqual(len(directory.images), 2)
        self.assertEqual(len(directory.text), 1)

    def test_aggregate(self):

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

    def test_create_recording(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        self.assertEqual(recording.directory, directory.relative_path)
        self.assertEqual(recording.title, "Keep It Like a Secret")
        self.assertEqual(recording.artist, "Built to Spill")
        self.assertEqual(recording.notes, directory.text[0])
        self.assertEqual(len(recording.tracks), len(directory.audio))
        self.assertEqual(recording.tracks[0].title, "The Plan")

class TestDirectoryServiceIndex(unittest.TestCase):

    def test_complete_index(self):

        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX + COMPLETE_INDEX)
        self.assertEqual(len(self.directory_service.list_all()), 0)

    def test_partial_index(self):

        indexed = [ "root/Edge of the Sun" ]
        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX + indexed)
        self.assertEqual(len(self.directory_service.list_all()), 2)
