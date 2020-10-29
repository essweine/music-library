import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";

function createRecordingList(app) { 

    let columns = [
        { display: "Artist", className: "recording-list-artist", type: "text" },
        { display: "Title", className: "recording-list-title", type: "text" },
        { display: "Date", className: "recording-list-date", type: "text" },
        { display: "Rating", className: "recording-list-rating", type: "rating" },
        { display: "Sound Rating", className: "recording-list-sound-rating", type: "rating" },
        { display: "", className: "recording-list-view", type: "icon" },
        { display: "", className: "recording-list-queue", type: "icon" },
        { display: "", className: "recording-list-play", type: "icon" },
    ];

    let root = createListRoot(columns, "recording-list-root", "recording-list-row");

    let query = {
        match: [ ],
        exclude: [ ],
        sort: [ "artist" ],
        order: "asc",
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

    let expandRow = (recording) => {
        let selected = document.getElementById(recording.id);
        selected.classList.add("list-row-highlighted");
        let next = selected.nextElementSibling;
        for (let track of recording.tracks) {
            let data = {
                values: [
                    "",
                    track.title,
                    "",
                    { itemType: "track", itemId: track.filename, rating: track.rating },
                    null,
                    null,
                    { name: "playlist_add", action: e => app.playerApi.queue(track) },
                    null,
                ],
                action: null
            }
            let row = root.createRow(data, true);
            row.classList.add("track-" + recording.id);
            row.classList.add("list-row-highlighted");
            (next != null) ? root.insertBefore(row, next) : root.append(row);
        }
    }

    let collapseRow = (recordingId) => {
        let selected = document.getElementById(recordingId);
        selected.classList.remove("list-row-highlighted");
        let tracks = Array.from(document.getElementsByClassName("track-" + recordingId));
        for (let track of tracks)
            track.remove();
    }

    let playRecording = (entry) => {
        app.playerApi.clearPlaylist();
        app.recordingApi.getRecording(entry.id, app.playerApi.queueRecording.bind(app.playerApi));
        app.playerApi.start();
    };

    root.getData = (entry) => {
        return {
            values: [
                entry.artist,
                entry.title,
                entry.recording_date,
                { itemType: "recording-rating", itemId: entry.id, rating: entry.rating },
                { itemType: "recording-sound-rating", itemId: entry.id, rating: entry.sound_rating },
                { name: "album", action: e => window.location.href = "/recording/" + entry.id },
                { name: "playlist_add", action: e => app.recordingApi.getRecording(entry.id, app.playerApi.queueRecording.bind(app.playerApi)) },
                { name: "playlist_play", action: e => playRecording(entry) },
            ],
            action: {
                selectId: entry.id,
                expand: e => app.recordingApi.getRecording(entry.id, expandRow),
                collapse: e => collapseRow(entry.id)
            }
        };
    }

    root.addHeading();

    document.title = "Browse Recordings";
    app.container = root;
}

export { createRecordingList };
