import { createRatingContainer } from "/static/components/rating-container.js";
import { createEditableInfo } from "/static/components/editable-info.js";
import { createIcon, createTracklistEvent, createTrackEvent } from "/static/components/icons.js";

function createRecordingTrack(track) {

    let entry = document.createElement("div");
    entry.classList.add("recording-track");

    entry.track = track;

    entry.trackNum = document.createElement("span");
    entry.trackNum.classList.add("recording-track-position");
    entry.append(entry.trackNum);

    entry.trackTitle = createEditableInfo("recording-track-title");
    entry.trackTitle.initialize(track.title, track.filename, track.filename);
    entry.append(entry.trackTitle);

    entry.ratingContainer = createRatingContainer("recording-track-rating");
    entry.ratingContainer.configure(track.recording_id, track.filename, track.rating);
    entry.append(entry.ratingContainer);

    entry.moveUp     = createIcon("arrow_upward", e => entry.dispatchEvent(createTracklistEvent("move-track-up")), "move-up");
    entry.moveDown   = createIcon("arrow_downward", e => entry.dispatchEvent(createTracklistEvent("move-track-down")), "move-down");
    entry.playTrack  = createIcon("play_arrow", e => entry.dispatchEvent(createTrackEvent("play-track", track)), "play-track");
    entry.queueTrack = createIcon("playlist_add", e => entry.dispatchEvent(createTrackEvent("queue-track", track)), "queue-track");

    entry.addEventListener("tracklist-action", e => {
        if (e.detail == "move-track-up")
            entry.dispatchEvent(new CustomEvent("move-track", { detail: entry.currentPosition, bubbles: true }));
        else if (e.detail == "move-track-down")
            entry.dispatchEvent(new CustomEvent("move-track", { detail: entry.currentPosition + 1, bubbles: true }));
        else if (e.detail == "remove-track")
            entry.dispatchEvent(new CustomEvent("remove-track", { detail: entry.currentPosition, bubbles: true }));
    });

    entry.toggleEdit = (editable) => {
        entry.trackTitle.toggleEdit(editable);
        if (editable) {
            entry.ratingContainer.remove();
            entry.playTrack.remove();
            entry.queueTrack.remove();
            entry.append(entry.moveUp);
            entry.append(entry.moveDown);
        } else {
            entry.moveUp.remove();
            entry.moveDown.remove();
            entry.append(entry.ratingContainer);
            entry.append(entry.playTrack);
            entry.append(entry.queueTrack);
        }
    }

    entry.updatePosition = (position, firstTrack, lastTrack) => {
        entry.trackNum.innerText = position + 1;
        entry.currentPosition = position;
        if (firstTrack) {
            entry.moveUp.hide();
            entry.moveDown.show();
        } else if (lastTrack) {
            entry.moveUp.show();
            entry.moveDown.hide();
        } else {
            entry.moveUp.show();
            entry.moveDown.show();
        }
    }

    entry.save = () => {
        entry.trackTitle.save();
        entry.track.title = entry.trackTitle.get();
        entry.track.track_num = entry.currentPosition + 1;
    }

    entry.reset = () => { entry.trackTitle.reset(); }

    return entry;
}


export { createRecordingTrack };
