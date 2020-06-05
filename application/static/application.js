import { Importer, Recording, Player } from "/static/modules/api.js";

import { ListRow, createDirectoryList, createRecordingList } from "/static/components/list-row.js";

import { RatingContainer } from "/static/components/rating-container.js";
import { UpArrow, DownArrow, RemoveButton, PlayButton, QueueButton } from "/static/components/tracklist-actions.js";

import { RecordingContainer, importRecording, viewRecording } from "/static/components/recording-container.js";
import { RecordingImage } from "/static/components/recording-image.js";
import { EditableInfo } from "/static/components/editable-info.js";
import { RecordingTrack } from "/static/components/recording-tracklist-entry.js";
import { RecordingTracksContainer } from "/static/components/recording-tracklist.js";
import { RecordingRawInfo } from "/static/components/recording-raw-info.js";

import { PlayerContainer, createPlayerContainer } from "/static/components/player-container.js";
import { CurrentTrack } from "/static/components/current-track.js";
import { NextTracksContainer, RecentlyPlayedContainer } from "/static/components/player-tracklist.js";
import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/player-tracklist-entry.js";
import { PlayerControls } from "/static/components/player-controls.js";

import { LogManager, createLogManager } from "/static/components/log-manager.js";

customElements.define("list-row", ListRow, { extends: "div" });

customElements.define("rating-container", RatingContainer, { extends: "span" });
customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });
customElements.define("play-button", PlayButton, { extends: "span" });
customElements.define("queue-button", QueueButton, { extends: "span" });

customElements.define("recording-container", RecordingContainer, { extends: "div" });
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

window.onload = e => {

    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : "";
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : "";

    let importerApi = new Importer();
    let recordingApi = new Recording();
    let playerApi = new Player();

    if (action == "")
        createPlayerContainer();
    else if (action == "importer" && arg != "")
        importerApi.getDirectoryListing(arg, importRecording);
    else if (action == "importer")
        importerApi.listAll(createDirectoryList);
    else if (action == "recording" && arg != "")
        recordingApi.getRecording(arg, viewRecording);
    else if (action == "recording")
        recordingApi.listAll(createRecordingList);
    else if (action == "log")
        createLogManager();
}
