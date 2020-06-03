import { createRatingContainer } from "/static/components/rating-container.js";
import { createEditableInfo } from "/static/components/editable-info.js";

class RecordingTrack extends HTMLDivElement {

    constructor() {
        super();
        this.classList.add("recording-track");
        this.track;
        this.currentPosition;

        this.trackNum = document.createElement("span");
        this.trackNum.classList.add("recording-track-position");
        this.append(this.trackNum);

        this.trackTitle = createEditableInfo("recording-track-title");
        this.append(this.trackTitle);

        this.ratingContainer = createRatingContainer();
        this.append(this.ratingContainer);
        this.ratingContainer.classList.add("recording-track-rating");

        this.moveUp = document.createElement("span", { is: "up-arrow" });
        this.moveUp.classList.add("move-up");

        this.moveDown = document.createElement("span", { is: "down-arrow" });
        this.moveDown.classList.add("move-down");

        this.addEventListener("move", e => {
            let detail = (e.detail == "up") ? this.currentPosition : this.currentPosition + 1;
            let ev = new CustomEvent("move-track", { detail: detail, bubbles: true });
            this.dispatchEvent(ev);
        });

        this.addEventListener("remove", e => {
            let ev = new CustomEvent("remove-track", { detail: this.currentPosition, bubbles: true });
            this.dispatchEvent(ev);
        });
    }

    toggleEdit(editable) {
        this.trackTitle.toggleEdit(editable);
        if (editable) {
            this.ratingContainer.remove();
            this.append(this.moveUp);
            this.append(this.moveDown);
        } else {
            this.moveUp.remove();
            this.moveDown.remove();
            this.append(this.ratingContainer);
        }
    }

    updatePosition (position, firstTrack, lastTrack) {
        this.trackNum.innerText = position + 1;
        this.currentPosition = position;
        if (firstTrack) {
            this.moveUp.hide();
            this.moveDown.show();
        } else if (lastTrack) {
            this.moveUp.show();
            this.moveDown.hide();
        } else {
            this.moveUp.show();
            this.moveDown.show();
        }
    }

    save() {
        this.trackTitle.save();
        this.track.title = this.trackTitle.get();
        this.track.track_num = this.currentPosition + 1;
    }

    reset() { this.trackTitle.reset(); }
}

function createRecordingTrack(track) {
    let entry = document.createElement("div", { is: "recording-track" });
    entry.track = track;
    entry.trackTitle.initialize(track.title, track.filename, track.filename);
    entry.ratingContainer.initialize(track.recording_id, track.filename, track.rating);
    return entry;
}

export { RecordingTrack, createRecordingTrack };
