import { createEditableInfo } from "../shared/editable-info.js";
import { createTrackTaglist } from "./taglist.js";
import { createRatingContainer } from "../shared/rating-container.js";
import { createIcon } from "../shared/icons.js";

function createRecordingTrack(tracklist, track) {

    let entry = document.createElement("div");
    entry.classList.add("recording-track");

    entry.track = track;

    let trackNum = document.createElement("span");
    trackNum.classList.add("recording-track-position");
    entry.append(trackNum);

    entry.trackTitle = createEditableInfo("recording-track-title");
    entry.trackTitle.initialize(track.title, track.filename, track.filename);
    entry.append(entry.trackTitle);

    let ratingContainer = createRatingContainer("recording-track-rating");
    ratingContainer.configure("recording", track.recording_id, track.filename, track.rating);
    entry.append(ratingContainer);

    let moveUp        = createIcon("arrow_upward", e => tracklist.shiftTrackUp(entry.currentPosition), "move-up");
    let moveDown      = createIcon("arrow_downward", e => tracklist.shiftTrackUp(entry.currentPosition + 1), "move-down");
    let queueTrack    = createIcon("playlist_add", e => tracklist.queueTrack(entry.track), "queue-track");
    let expandTrack   = createIcon("expand_more", e => entry.toggleDetail(true), "expand-track");
    let collapseTrack = createIcon("expand_less", e => entry.toggleDetail(false), "collapse-track");

    let detailVisible = false;

    let tags = { artist: "Artist", guest: "Guest Artist", composer: "Composer", genre: "Genre" };

    let taglist = createTrackTaglist(tags);
    entry.append(taglist);

    for (let prop of Object.keys(tags))
        for (let value of track[prop])
            taglist.addProperty(prop, value);

    entry.toggleDetail = (visible) => {
        if (visible) {
            expandTrack.remove();
            entry.insertBefore(collapseTrack, taglist);
            taglist.style.display = "block";
        } else {
            collapseTrack.remove();
            entry.insertBefore(expandTrack, taglist);
            taglist.style.display = "none";
        }
    }

    entry.toggleEdit = (editable) => {
        entry.trackTitle.toggleEdit(editable);
        taglist.toggleEdit(editable);
        if (editable) {
            ratingContainer.remove();
            queueTrack.remove();
            entry.insertBefore(moveUp, taglist);
            entry.insertBefore(moveDown, taglist);
        } else {
            moveUp.remove();
            moveDown.remove();
            entry.insertBefore(ratingContainer, taglist);
            entry.insertBefore(queueTrack, taglist);
        }
        entry.toggleDetail(detailVisible);
    }

    entry.updatePosition = (position, firstTrack, lastTrack) => {
        trackNum.innerText = position + 1;
        entry.currentPosition = position;
        if (firstTrack) {
            moveUp.hide();
            moveDown.show();
        } else if (lastTrack) {
            moveUp.show();
            moveDown.hide();
        } else {
            moveUp.show();
            moveDown.show();
        }
    }

    entry.addProperty = (property, value) => {
        let tag = taglist.findTag(property, value);
        if (tag == null)
            taglist.addProperty(property, value);
    }

    entry.removeProperty = (property, value) => {
        let tag = taglist.findTag(property, value);
        if (tag != null)
            taglist.removeProperty(tag, property, value);
    }

    entry.save = () => {
        entry.trackTitle.save();
        entry.track.track_num = entry.currentPosition + 1;
        entry.track.title = entry.trackTitle.get();
        let properties = taglist.getProperties();
        for (let prop of Object.keys(properties))
            entry.track[prop] = properties[prop];
    }

    entry.reset = () => { entry.trackTitle.reset(); }

    return entry;
}

export { createRecordingTrack };
