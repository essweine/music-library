import { RecordingContainer } from "/static/components/recording-container.js";
import { RecordingImage } from "/static/components/recording-image.js";
import { RecordingInfo } from "/static/components/recording-info.js";

import { TracklistContainer } from "/static/components/tracklist-container.js";
import { TracklistEntry } from "/static/components/tracklist-entry.js";
import { RawRecordingInfo } from "/static/components/raw-recording-info.js";

customElements.define("recording-container", RecordingContainer, { extends: "div" });

customElements.define("recording-image", RecordingImage, { extends: "div" });
customElements.define("recording-info", RecordingInfo, { extends: "div" });

customElements.define("tracklist-container", TracklistContainer, { extends: "div" });
customElements.define("tracklist-entry", TracklistEntry, { extends: "div" });
customElements.define("raw-recording-info", RawRecordingInfo, { extends: "div" });

window.onload = e => {
    let recordingContainer = document.getElementById("recording-container");
    recordingContainer.initialize();
    recordingContainer.update();
}
