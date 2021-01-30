#!/usr/bin/env python

import argparse
import unittest
from test import setUpModule, tearDownModule
from test import test_directory_service, test_recording, test_playlist, test_station, test_player, test_podcast

suites = {
    "importer": unittest.defaultTestLoader.loadTestsFromModule(test_directory_service),
    "recording": unittest.defaultTestLoader.loadTestsFromModule(test_recording),
    "playlist": unittest.defaultTestLoader.loadTestsFromModule(test_playlist),
    "station": unittest.defaultTestLoader.loadTestsFromModule(test_station), 
    "player": unittest.defaultTestLoader.loadTestsFromModule(test_player),
    "podcast": unittest.defaultTestLoader.loadTestsFromModule(test_podcast),
}

if __name__ == "__main__":

    parser = argparse.ArgumentParser("test runner for music library")
    parser.add_argument("-s", "--suites", metavar = "NAME", dest = "suites", nargs = "+", default = suites,
                        help = "run tests from %(metavar)s: options are " + ", ".join(suites.keys()))
    parser.add_argument("-x", "--exclude", dest = "exclude", action = "store_true",
                        help = "exclude rather than run suite(s)")
    parser.add_argument("-v", "--verbosity", metavar = "LEVEL", dest = "verbosity", default = 2,
                        help = "use verbosity level %(metavar)s [default %(default)d]")
    args = parser.parse_args()

    setUpModule()
    runner = unittest.TextTestRunner(verbosity = args.verbosity)
    for name, suite in suites.items():
        print(f"\nResults for {name}")
        if name in args.suites and not args.exclude:
            runner.run(suite)
        elif name not in args.suites and args.exclude:
            runner.run(suite)
        else:
            print("skipped")
    tearDownModule()

