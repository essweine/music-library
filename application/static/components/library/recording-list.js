import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";

function createRecordingList(app) { 

    let root = createListRoot("recording-list-root");
    let query = {
        match: [ ],
        exclude: [ ],
        official: true,
        nonofficial: true,
        unrated: false,
        never_listened: false,
    }
    let search = createSearchBar(root, query);
    root.configureSearch = (config) => search.initialize(config);

    search.addCheckbox("Official", "official", "list-search-official");
    search.addCheckbox("Non-official", "nonofficial", "list-search-nonofficial");
    search.addCheckbox("Unrated Only", "unrated", "list-search-unrated");

    root.append(search);

    root.updateResults = (query) => app.searchApi.searchRecordings(query, root.update);

    let listHeader = createListRow("list-heading");
    for (let colName of [ "Artist", "Title", "Date", "Rating", "Sound Rating" ])
        listHeader.addText(colName, "recording-list-" + colName.replace(" ", "-").toLowerCase());
    listHeader.addText("", "recording-list-view");
    listHeader.addText("", "recording-list-play");
    listHeader.addText("", "recording-list-queue");
    root.append(listHeader);

    root.addTrack = (track, recordingId) => {
        let row = createListRow("recording-list-track", false);
        row.classList.add("track-" + recordingId);
        row.addText("", "recording-list-artist");
        row.addText(track.title, "recording-list-title");
        row.addText("", "recording-list-date");
        row.addRatingContainer("track", track.filename, track.rating, "recording-list-rating");
        row.addText("", "recording-list-sound-rating");
        row.addText("", "recording-list-view");
        row.addText("", "recording-list.play");
        row.addIcon("playlist_add", e => app.playerApi.queue(track));
        return row;
    }

    root.expandRow = (recording) => {
        let selected = document.getElementById(recording.id);
        let next = selected.nextElementSibling;
        for (let track of recording.tracks) {
            let row = root.addTrack(track, recording.id);
            (next != null) ? root.insertBefore(row, next) : root.append(row);
        }
    }

    root.collapseRow = (recordingId) => {
        let tracks = Array.from(document.getElementsByClassName("track-" + recordingId));
        for (let track of tracks)
            track.remove();
    }

    root.addRow = (entry) => {
        let row = createListRow("recording-list-row");
        row.id = entry.id;
        row.addText(entry.artist, "recording-list-artist");
        row.addText(entry.title, "recording-list-title");
        row.addText(entry.recording_date, "recording-list-date");
        row.addRatingContainer("recording-rating", entry.id, entry.rating, "recording-list-rating");
        row.addRatingContainer("recording-sound-rating", entry.id, entry.sound_rating, "recording-list-sound-rating");
        row.addIcon("info", e => window.location.href = "/recording/" + entry.id, "recording-list-view");
        row.addIcon("playlist_play", e => {
            app.playerApi.clearPlaylist();
            app.recordingApi.getRecording(entry.id, app.playerApi.queueRecording.bind(app.playerApi));
            app.playerApi.start();
        });
        row.addIcon("playlist_add", e => app.recordingApi.getRecording(entry.id, app.playerApi.queueRecording.bind(app.playerApi)));
        row.setExpandable(
            e => app.recordingApi.getRecording(entry.id, app.container.expandRow),
            e => app.container.collapseRow(entry.id)
        );
        return row;
    }

    document.title = "Browse Recordings";
    app.container = root;
}

export { createRecordingList };
