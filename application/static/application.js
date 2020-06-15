import { Importer, Recording, Player } from "/static/modules/api.js";

import { createDirectoryList, createRecordingList } from "/static/components/item-list.js";

import { RatingContainer } from "/static/components/rating-container.js";
import { UpArrow, DownArrow, RemoveTrackIcon, PlayTrackIcon, QueueTrackIcon } from "/static/components/tracklist-actions.js";

import { createImportContainer, createRecordingContainer } from "/static/components/recording-container.js";
import { RecordingImage } from "/static/components/recording-image.js";
import { EditableInfo } from "/static/components/editable-info.js";
import { RecordingTrack } from "/static/components/recording-tracklist-entry.js";
import { RecordingTracksContainer } from "/static/components/recording-tracklist.js";
import { RecordingRawInfo } from "/static/components/recording-raw-info.js";

import { PlayerContainer } from "/static/components/player-container.js";
import { CurrentTrack } from "/static/components/current-track.js";
import { NextTracksContainer, RecentlyPlayedContainer } from "/static/components/player-tracklist.js";
import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/player-tracklist-entry.js";
import { PlayerControls } from "/static/components/player-controls.js";

import { LogManager } from "/static/components/log-manager.js";

customElements.define("rating-container", RatingContainer, { extends: "span" });
customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-track-icon", RemoveTrackIcon, { extends: "span" });
customElements.define("play-track-icon", PlayTrackIcon, { extends: "span" });
customElements.define("queue-track-icon", QueueTrackIcon, { extends: "span" });

customElements.define("recording-image", RecordingImage, { extends: "div" });
customElements.define("editable-info", EditableInfo, { extends: "div" });
customElements.define("recording-track", RecordingTrack, { extends: "div" });
customElements.define("recording-tracklist", RecordingTracksContainer, { extends: "div" });
customElements.define("recording-raw-info", RecordingRawInfo, { extends: "div" });

customElements.define("player-container", PlayerContainer, { extends: "div" });
customElements.define("current-track", CurrentTrack, { extends: "div" });
customElements.define("player-controls", PlayerControls, { extends: "div" });
customElements.define("next-tracks", NextTracksContainer, { extends: "div" });
customElements.define("recently-played", RecentlyPlayedContainer, { extends: "div" });
customElements.define("next-tracks-entry", NextTracksEntry, { extends: "div" });
customElements.define("recently-played-entry", RecentlyPlayedEntry, { extends: "div" });

customElements.define("log-manager", LogManager, { extends: "div" });

class Application {

    constructor(action, arg) {

        this.importerApi = new Importer();
        this.recordingApi = new Recording();
        this.playerApi = new Player();

        this.container = this.selectContainer(action, arg);
        this.content = document.getElementById("content");
        this.content.append(this.container);

        this.content.addEventListener("play-track", e => this.playerApi.play(e.detail));
        this.content.addEventListener("play-tracks", e => this.playerApi.playAll(e.detail));
        this.content.addEventListener("play-recording", 
            e => this.recordingApi.getRecording(e.detail, this.playerApi.playRecording.bind(this.playerApi)));

        this.content.addEventListener("queue-track", e => this.playerApi.queue(e.detail));
        this.content.addEventListener("queue-tracks", e => this.playerApi.queueAll(e.detail));
        this.content.addEventListener("queue-recording", 
            e => this.recordingApi.getRecording(e.detail, this.playerApi.queueRecording.bind(this.playerApi)));

        this.content.addEventListener("add-recording", e => this.recordingApi.addToLibrary(e.detail));
        this.content.addEventListener("save-recording", e => this.recordingApi.saveRecording(e.detail));

        this.content.addEventListener("update-rating", e => {
            let recordingId = e.detail.recordingId;
            let data = e.detail.data;
            this.recordingApi.updateRating(recordingId, data);
        });

        this.content.addEventListener("expand-tracks", e => this.recordingApi.getRecording(e.detail, this.container.expandRow));
        this.content.addEventListener("collapse-tracks", e => this.container.collapseRow(e.detail));
    }

    selectContainer(action, arg) {
        if (action == "importer" && arg != null) {
            let container = createImportContainer();
            this.importerApi.getDirectoryListing(arg, container.initialize);
            return container;
        } else if (action == "importer") {
            document.title = "Unindexed Directory List";
            let container = createDirectoryList("directory-list-root");
            this.importerApi.listAll(container.addRows);
            return container;
        } else if (action == "recording" && arg != null) {
            let container = createRecordingContainer();
            this.recordingApi.getRecording(arg, container.initialize);
            return container;
        } else if (action == "recording") {
            document.title = "Browse Recordings";
            let container = createRecordingList("recording-list-root");
            this.recordingApi.listAll(container.addRows);
            return container;
        } else if (action == "log") {
            document.title = "Player Logs";
            return document.createElement("div", { is: "log-manager" });
        } else {
            document.title = "Now Playing";
            return document.createElement("div", { is: "player-container" });
        }
    }
}

window.onload = e => {

    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : null
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : null

    let app = new Application(action, arg);
}
