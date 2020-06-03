import { Recording } from "/static/modules/api.js";

import { RecordingContainer, viewRecording } from "/static/components/recording-container.js";

import { RecordingImage } from "/static/components/recording-image.js";
import { EditableInfo } from "/static/components/editable-info.js";

customElements.define("recording-container", RecordingContainer, { extends: "div" });
customElements.define("recording-image", RecordingImage, { extends: "div" });
customElements.define("editable-info", EditableInfo, { extends: "div" });

import { UpArrow, DownArrow, RemoveButton } from "/static/components/tracklist-actions.js";
import { RatingContainer } from "/static/components/rating-container.js";

customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });
customElements.define("rating-container", RatingContainer, { extends: "span" });

import { RecordingTrack } from "/static/components/recording-tracklist-entry.js";
import { RecordingTracksContainer } from "/static/components/recording-tracklist.js";
import { RecordingRawInfo } from "/static/components/recording-raw-info.js";

customElements.define("recording-track", RecordingTrack, { extends: "div" });
customElements.define("recording-tracklist", RecordingTracksContainer, { extends: "div" });
customElements.define("recording-raw-info", RecordingRawInfo, { extends: "div" });

window.onload = e => {
    let recordingId  = window.location.href.split("/").pop();
    let recordingApi = new Recording();
    recordingApi.getRecording(recordingId, viewRecording);
}

