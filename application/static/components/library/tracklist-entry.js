import { createEditableInfo } from "../shared/editable-info.js";
import { createRatingContainer } from "../shared/rating-container.js";
import { createIcon } from "../shared/icons.js";

function createRecordingTrack(tracklist, track) {

    let entry = document.createElement("div");
    entry.classList.add("recording-track");

    entry.track = track;
    entry.detailVisible = false;

    entry.trackNum = document.createElement("span");
    entry.trackNum.classList.add("recording-track-position");
    entry.append(entry.trackNum);

    entry.trackTitle = createEditableInfo("recording-track-title");
    entry.trackTitle.initialize(track.title, track.filename, track.filename);
    entry.append(entry.trackTitle);

    entry.ratingContainer = createRatingContainer("recording-track-rating");
    entry.ratingContainer.configure("recording", track.recording_id, track.filename, track.rating);
    entry.append(entry.ratingContainer);

    entry.moveUp        = createIcon("arrow_upward", e => tracklist.shiftTrackUp(entry.currentPosition), "move-up");
    entry.moveDown      = createIcon("arrow_downward", e => tracklist.shiftTrackUp(entry.currentPosition + 1), "move-down");
    entry.queueTrack    = createIcon("playlist_add", e => tracklist.queueTrack(entry.track), "queue-track");
    entry.expandTrack   = createIcon("expand_more", e => entry.toggleDetail(true), "expand-track");
    entry.collapseTrack = createIcon("expand_less", e => entry.toggleDetail(false), "collapse-track");

    entry.artist   = createEditableInfo("recording-track-artist");
    entry.guest    = createEditableInfo("recording-track-guest");
    entry.composer = createEditableInfo("recording-track-composer");
    entry.genre    = createEditableInfo("recording-track-genre");

    entry.artist.initialize(track.artist, "artist", "Artist");
    entry.composer.initialize(track.composer, "composer", "Composer");
    entry.guest.initialize(track.guest, "guest", "Guest Artist");
    entry.genre.initialize(track.genre, "genre", "Genre");

    entry.updateDetailDisplay = () => {
        entry.artist.display.innerText = (track.artist != null) ? "Artist: " + track.artist : "Artist:";
        entry.guest.display.innerText = (track.guest != null) ? "Guest Artist: " + track.guest : "Guest Artist:";
        entry.composer.display.innerText = (track.composer != null) ? "Composer: " + track.composer : "Composer:";
        entry.genre.display.innerText = (track.genre != null) ? "Genre: " + track.genre : "Genre:";
    }

    entry.toggleDetail = (detailVisible) => {
        entry.updateDetailDisplay()
        if (detailVisible) {
            entry.expandTrack.remove();
            entry.append(entry.collapseTrack);
            entry.append(entry.artist);
            entry.append(entry.guest);
            entry.append(entry.composer);
            entry.append(entry.genre);
        } else {
            entry.collapseTrack.remove();
            entry.artist.remove();
            entry.guest.remove();
            entry.composer.remove();
            entry.genre.remove();
            entry.append(entry.expandTrack);
        }
    }

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
        entry.artist.toggleEdit(editable);
        entry.guest.toggleEdit(editable);
        entry.composer.toggleEdit(editable);
        entry.genre.toggleEdit(editable);
        entry.toggleDetail(entry.detailVisible);
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
        entry.artist.save();
        entry.guest.save();
        entry.composer.save();
        entry.genre.save();

        entry.track.track_num = entry.currentPosition + 1;
        entry.track.title = entry.trackTitle.get();
        entry.track.artist = entry.artist.get().split(",");
        entry.track.guest = entry.guest.get().split(",");
        entry.track.composer = entry.composer.get().split(",");
        entry.track.genre = entry.genre.get().split(",");

        entry.updateDetailDisplay();
    }

    entry.reset = () => { entry.trackTitle.reset(); }

    return entry;
}


export { createRecordingTrack };
