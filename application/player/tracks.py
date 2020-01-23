import time
import os
from collections import namedtuple
dirname = "/home/essweine/2006-10-10 Washington"
Track = namedtuple('Track', [ "filename" ])
tracks = sorted([ Track(os.path.join(dirname, d)) for d in os.listdir(dirname) ])


