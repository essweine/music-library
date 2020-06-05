import { Recording, Player } from "/static/modules/api.js";
import { createRatingContainer } from "/static/components/rating-container.js";

class ListRow extends HTMLDivElement {
    constructor() {
        super();
    }

    addText(text, className) {
        let cell = document.createElement("span");
        cell.innerText = text;
        cell.classList.add("list-cell");
        cell.classList.add(className);
        this.append(cell);
    }

    addIcon(iconName, action, className) {
        let icon = document.createElement("span");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add(className);
        icon.onclick = action;
        this.append(icon);
    }

    addRatingContainer(recordingId, ratedItem, rating, className) {
        let ratingContainer = createRatingContainer();
        ratingContainer.initialize(recordingId, ratedItem, rating);
        ratingContainer.classList.add(className);
        ratingContainer.classList.add("list-cell");
        this.append(ratingContainer);
    }
}

function createListRow(className) {
    let listRow = document.createElement("div", { is: "list-row" });
    listRow.classList.add("list-row");
    listRow.classList.add(className);
    return listRow;
}

function createDirectoryList(directoryList) {

    document.title = "Unindexed Directory List";

    let container = document.createElement("div");
    container.classList.add("list-root");

    let listHeader = createListRow("list-heading");
    container.append(listHeader);
    for (let colName of [ "Directory", "Audio", "Images", "Text" ])
        listHeader.addText(colName, "directory-list-" + colName.toLowerCase());

    for (let entry of directoryList) {
        let row = createListRow("directory-list-row");
        row.addText(entry.relative_path, "directory-list-directory");
        row.addText(entry.audio.length, "directory-list-audio");
        row.addText(entry.images.length, "directory-list-images");
        row.addText(entry.text.length, "directory-list-text");
        row.addIcon("add", e => window.location.href = "/importer/" + entry.relative_path, "directory-list-add");
        container.append(row);
    }

    let content = document.getElementById("content");
    content.append(container);
}

function createRecordingList(recordingList) {

    document.title = "Browse Recordings";
   
    let recordingApi = new Recording();
    let playerApi    = new Player();

    let container = document.createElement("div");
    container.classList.add("list-root");

    let listHeader = createListRow("list-heading");
    container.append(listHeader);
    for (let colName of [ "Artist", "Title", "Date", "Rating", "Sound Rating" ])
        listHeader.addText(colName, "recording-list-" + colName.replace(" ", "-").toLowerCase());

    function playAll(recordingId) { return e => recordingApi.getRecording(recordingId, playerApi.playRecording.bind(playerApi)); }

    function queueAll(recordingId) { return e => recordingApi.getRecording(recordingId, playerApi.queueRecording.bind(playerApi)); }

    for (let entry of recordingList) {
        let row = createListRow("recording-list-row");
        row.addText(entry.artist, "recording-list-artist");
        row.addText(entry.title, "recording-list-title");
        row.addText(entry.recording_date, "recording-list-date");
        row.addRatingContainer(entry.id, "rating", entry.rating, "recording-list-rating");
        row.addRatingContainer(entry.id, "sound-rating", entry.sound_rating, "recording-list-sound-rating");
        row.addIcon("info", e => window.location.href = "/recording/" + entry.id, "recording-list-view");
        row.addIcon("playlist_play", playAll(entry.id), "recording-list-play");
        row.addIcon("playlist_add", queueAll(entry.id), "recording-list-queue");
        container.append(row);
    }

    let content = document.getElementById("content");
    content.append(container);
}

export { ListRow, createDirectoryList, createRecordingList };
