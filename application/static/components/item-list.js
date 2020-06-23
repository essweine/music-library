import { createRatingContainer } from "/static/components/rating-container.js";
import { createIcon, createRecordingEvent, createTrackEvent } from "/static/components/icons.js";
import { createSearchBar } from "/static/components/search-bar.js";

function createListRow(className, parent = true) {

    let row = document.createElement("div");
    (parent) ? row.classList.add("list-row") : row.classList.add("list-row-child");
    row.classList.add(className);
    row.collapsed = true;
    row.textCells = [ ];

    row.addText = (text, className) => {
        let cell = document.createElement("span");
        cell.innerText = text;
        cell.classList.add(className);
        cell.classList.add("list-cell");
        row.textCells.push(cell);
        row.append(cell);
    }

    row.addIcon = (name, action, classNames) => {
        let icon = createIcon(name, action, classNames);
        row.append(icon);
    }

    row.addRatingContainer = (recordingId, ratedItem, rating, className) => {
        let ratingContainer = createRatingContainer("list-cell");
        ratingContainer.configure(recordingId, ratedItem, rating);
        ratingContainer.classList.add(className);
        row.append(ratingContainer);
    }

    row.setExpandable = (expand, collapse) => {
        for (let elem of row.textCells)
            elem.onclick = e => {
                (row.collapsed) ? expand() : collapse();
                row.collapsed = !row.collapsed;
            };
    }

    return row;
}

function createListRoot(className) {

    let root = document.createElement("div");
    root.classList.add("list-root");
    root.classList.add(className);

    root.addRows = (items) => {
        for (let entry of items) {
            let row = root.addRow(entry);
            root.append(row);
        }
    }

    root.clear = () => {
        for (let row of Array.from(document.getElementsByClassName("list-row")))
            if (!row.classList.contains("list-heading"))
                row.remove();
        for (let row of Array.from(document.getElementsByClassName("list-row-child")))
            row.remove();
    }

    root.update = (items) => {
        root.clear();
        root.addRows(items);
    }

    return root;
}

function createDirectoryList(className) {

    let root = createListRoot(className);

    let listHeader = createListRow("list-heading");
    for (let colName of [ "Directory", "Audio", "Images", "Text" ])
        listHeader.addText(colName, "directory-list-" + colName.toLowerCase());
    root.append(listHeader);

    root.addRow = (entry) => {
        let row = createListRow("directory-list-row");
        row.addText(entry.relative_path, "directory-list-directory");
        row.addText(entry.audio.length, "directory-list-audio");
        row.addText(entry.images.length, "directory-list-images");
        row.addText(entry.text.length, "directory-list-text");
        row.addIcon("add", e => window.location.href = "/importer/" + entry.relative_path, "directory-list-add");
        return row;
    }

    document.title = "Unindexed Directory List";
    return root;
}

function createRecordingList(className) { 

    let root = createListRoot(className);

    let search = createSearchBar();
    root.append(search);

    let listHeader = createListRow("list-heading");
    for (let colName of [ "Artist", "Title", "Date", "Rating", "Sound Rating" ])
        listHeader.addText(colName, "recording-list-" + colName.replace(" ", "-").toLowerCase());
    root.append(listHeader);

    root.addTrack = (track, recordingId) => {
        let row = createListRow("recording-list-track", false);
        row.classList.add("track-" + recordingId);
        row.addText("", "recording-list-artist");
        row.addText(track.title, "recording-list-title");
        row.addText("", "recording-list-date");
        row.addRatingContainer(recordingId, track.filename, track.rating, "recording-list-rating");
        row.addText("", "recording-list-sound-rating");
        row.addText("", "recording-list-view");
        row.addIcon("play_arrow", e => root.dispatchEvent(createTrackEvent("play-track", track)), "recording-list-play");
        row.addIcon("playlist_add", e => root.dispatchEvent(createTrackEvent("queue-track", track)), "recording-list-queue");
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
        row.addRatingContainer(entry.id, "rating", entry.rating, "recording-list-rating");
        row.addRatingContainer(entry.id, "sound-rating", entry.sound_rating, "recording-list-sound-rating");
        row.addIcon("info", e => window.location.href = "/recording/" + entry.id, "recording-list-view");
        row.addIcon("playlist_play", e => root.dispatchEvent(createRecordingEvent("play-recording", entry.id)), "recording-list-play");
        row.addIcon("playlist_add", e => root.dispatchEvent(createRecordingEvent("queue-recording", entry.id)), "recording-list-queue");
        row.setExpandable(
            e => row.dispatchEvent(createRecordingEvent("expand-tracks", entry.id)),
            e => row.dispatchEvent(createRecordingEvent("collapse-tracks", entry.id))
        );
        return row;
    }

    document.title = "Browse Recordings";
    return root;
}

export { createDirectoryList, createRecordingList };
