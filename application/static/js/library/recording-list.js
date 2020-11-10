import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";
import { Rating } from "../api.js";

function createRecordingList(api) { 

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
        sort: [ "artist", "recording_date" ],
        order: "asc",
        official: true,
        nonofficial: true,
        unrated: false,
    }
    let search = createSearchBar(root, query, "recording-list-search");
    root.configureSearch = (config) => search.initialize(config);

    search.addCheckbox("Official", "official", "list-search-official");
    search.addCheckbox("Non-official", "nonofficial", "list-search-nonofficial");
    search.addCheckbox("Unrated Only", "unrated", "list-search-unrated");

    root.append(search);

    root.updateResults = (query) => api.query("recording", query, root.update);

    let expandRow = (recording) => {
        let selected = document.getElementById(recording.id);
        selected.classList.add("list-row-expanded");
        let next = selected.nextElementSibling;
        for (let track of recording.tracks) {
            let data = {
                values: [
                    "",
                    track.title,
                    "",
                    new Rating("track", track.filename, track.rating),
                    null,
                    null,
                    { name: "playlist_add", action: e => api.queue(track) },
                    null,
                ],
                action: null
            }
            let row = root.createRow(data, true);
            row.classList.add("track-" + recording.id);
            row.classList.add("list-row-expanded");
            (next != null) ? root.insertBefore(row, next) : root.append(row);
        }
    }

    let collapseRow = (recordingId) => {
        let selected = document.getElementById(recordingId);
        selected.classList.remove("list-row-expanded");
        let tracks = Array.from(document.getElementsByClassName("track-" + recordingId));
        for (let track of tracks)
            track.remove();
    }

    let playRecording = (entry) => {
        api.clearCurrentPlaylist();
        api.getRecording(entry.id, api.queueRecording.bind(api));
        api.start();
    };

    root.getData = (entry) => {
        return {
            values: [
                entry.artist,
                entry.title,
                entry.recording_date,
                new Rating("recording-rating", entry.id, entry.rating),
                new Rating("recording-sound-rating", entry.id, entry.sound_rating),
                { name: "album", action: e => window.location.href = "/recording/" + entry.id },
                { name: "playlist_add", action: e => api.getRecording(entry.id, api.queueRecording.bind(api)) },
                { name: "playlist_play", action: e => playRecording(entry) },
            ],
            action: {
                selectId: entry.id,
                expand: e => api.getRecording(entry.id, expandRow),
                collapse: e => collapseRow(entry.id)
            }
        };
    }

    root.addHeading();

    document.title = "Browse Recordings";
    api.getSearchConfig("recording", root.configureSearch);
    api.getAllRecordings(root.addRows);
    return root;
}

export { createRecordingList };
