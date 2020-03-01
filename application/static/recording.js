import { UpArrow, DownArrow } from "/static/components/move-button.js";
import { RemoveButton } from "/static/components/remove-button.js";
import { RatingContainer } from "/static/components/rating-container.js";

customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });
customElements.define("rating-container", RatingContainer, { extends: "span" });

import { RecordingTrack } from "/static/components/recording-tracklist-entry.js";
import { RecordingTracksContainer } from "/static/components/recording-tracklist.js";
import { RecordingImage } from "/static/components/recording-image.js";
import { RecordingInfo } from "/static/components/recording-info.js";
import { RecordingRawInfo } from "/static/components/recording-raw-info.js";

customElements.define("recording-track", RecordingTrack, { extends: "div" });
customElements.define("recording-tracklist", RecordingTracksContainer, { extends: "div" });
customElements.define("recording-image", RecordingImage, { extends: "div" });
customElements.define("recording-info", RecordingInfo, { extends: "div" });
customElements.define("recording-raw-info", RecordingRawInfo, { extends: "div" });

import { RecordingContainer } from "/static/components/recording-container.js";

customElements.define("recording-container", RecordingContainer, { extends: "div" });

window.onload = e => {
    let recordingContainer = document.getElementById("recording-container");
    recordingContainer.initialize();
    recordingContainer.getDirectoryListing();
    recordingContainer.getRecordingInfoFromNotes();
    recordingContainer.update();
}
