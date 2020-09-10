import { createEditableInfo } from "./editable-info.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createIcon } from "/static/components/shared/icons.js";

function createRecordingTrack(tracklist, track) {

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

    entry.moveUp     = createIcon("arrow_upward", e => tracklist.shiftTrackUp(entry.currentPosition));
    entry.moveDown   = createIcon("arrow_downward", e => tracklist.shiftTrackUp(entry.currentPosition + 1));
    entry.queueTrack = createIcon("playlist_add", e => tracklist.queueTrack(entry.track), "queue-track");

    entry.toggleEdit = (editable) => {
        entry.trackTitle.toggleEdit(editable);
        if (editable) {
            entry.ratingContainer.remove();
            entry.queueTrack.remove();
            entry.append(entry.moveUp);
            entry.append(entry.moveDown);
        } else {
            entry.moveUp.remove();
            entry.moveDown.remove();
            entry.append(entry.ratingContainer);
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
