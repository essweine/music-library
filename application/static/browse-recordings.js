import { Recording, Player } from "/static/modules/api.js";
import { ListRow, createListRow } from "/static/components/list-row.js";
import { RatingContainer } from "/static/components/rating-container.js";

customElements.define("list-row", ListRow, { extends: "div" });
customElements.define("rating-container", RatingContainer, { extends: "span" });

window.onload = e => {

    document.title = "Browse Recordings";
    let recordingApi = new Recording();
    let playerApi = new Player();

    let container = document.getElementById("content");
    let directoryList = document.createElement("div");
    directoryList.classList.add("list-root");
    container.append(directoryList);

    let listHeader = createListRow("list-heading");
    directoryList.append(listHeader);
    for (let colName of [ "Artist", "Title", "Date", "Rating", "Sound Rating" ])
        listHeader.addText(colName, "recording-list-" + colName.replace(" ", "-").toLowerCase());

    function viewRecording(recordingId) { return e => window.location.href = "/recording/" + recordingId; }

    function playAll(recordingId) { return e => recordingApi.getRecording(recordingId, playerApi.playRecording.bind(playerApi)); }

    function addEntry(response) {
        for (let entry of response) {
            let row = createListRow("recording-list-row");
            row.addText(entry.artist, "recording-list-artist");
            row.addText(entry.title, "recording-list-title");
            row.addText(entry.recording_date, "recording-list-date");
            row.addRatingContainer(entry.id, "rating", entry.rating, "recording-list-rating");
            row.addRatingContainer(entry.id, "sound-rating", entry.sound_rating, "recording-list-sound-rating");
            row.addIcon("info", viewRecording(entry.id), "recording-list-view");
            row.addIcon("playlist_play", playAll(entry.id), "recording-list-play");
            directoryList.append(row);
        }
    }

    recordingApi.listAll(addEntry);
}
