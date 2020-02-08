from datetime import datetime
from .recording import RECORDING_COLUMNS, TRACK_COLUMNS

def table_definition(name, COLUMNS):

    col_def = lambda col: col.type if col.default is None else "{0} default {1}".format(col.type, col.default)
    columns, col_defs = zip(*[ (col.name, col_def(col)) for col in COLUMNS ])
    return "create table if not exists {name} ({table_def})".format(
        name = name,
        table_def = ", ".join([ "{0} {1}".format(col, col_def) for col, col_def in zip(columns, col_defs) ]),
    )

def insert_statement(name, COLUMNS):

    columns, placeholders = zip(*[ (col.name, "?") for col in COLUMNS ])
    return "insert into {name} ({columns}) values ({placeholders})".format(
        name = name,
        columns = ", ".join(columns),
        placeholders = ", ".join(placeholders),
    )

def create_recording(cursor, **recording):

    insert_recording = insert_statement("recording", RECORDING_COLUMNS)
    insert_track = insert_statement("track", TRACK_COLUMNS)

    recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
    recording_values = [ recording.get(col.name, col.default) for col in RECORDING_COLUMNS ]
    get_track = lambda track: [ track.get(col.name, col.default) for col in TRACK_COLUMNS ]
    for track in recording.get("tracks", [ ]):
        track["recording_id"] = recording["id"]
    tracks_values = [ get_track(track) for track in recording.get("tracks", [ ]) ]

    try:
        cursor.execute(insert_recording, recording_values)
        cursor.executemany(insert_track, tracks_values)
    except Exception as exc:
        raise

def update_recording(cursor, **recording):

    recording_cols = [ col for col in RECORDING_COLUMNS if col.updateable ]
    recording_vals = [ recording.get(col.name) for col in recording_cols ] + [ recording.get("id") ]
    update_recording = "update recording set {0} where id=?".format(
        ", ".join([ "{0}=?".format(col.name) for col in recording_cols ])
    )

    track_cols = [ col for col in TRACK_COLUMNS if col.updateable ]
    get_track = lambda track: [ track.get(col.name) for col in track_cols ] + [ track.get("filename") ]
    track_vals = [ get_track(track) for track in recording.get("tracks", [ ]) ]
    update_track = "update track set {0} where filename=?".format(
        ", ".join([ "{0}=?".format(col.name) for col in track_cols ])
    )

    try:
        cursor.execute(update_recording, recording_vals)
        cursor.executemany(update_track, track_vals)
    except:
        raise

def update_rating(cursor, recording_id, data):

    item = data.get("item")
    rating = data.get("rating")

    if item == "recording":
        update = "update recording set rating=? where id=?"
        values = (rating, recording_id)
    elif item == "sound_rating":
        update = "update recording set sound_rating=? where id=?"
        values = (rating, recording_id)
    else:
        update = "update track set rating=? where filename=?"
        values = (rating, item)

    try:
        cursor.execute(update, values)
    except:
        raise
