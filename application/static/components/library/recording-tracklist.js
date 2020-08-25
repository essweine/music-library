import { createTracklistContainer } from "/static/components/shared/tracklist-container.js";
import { createRecordingTrack } from "./recording-tracklist-entry.js";

function createRecordingTracklist() {

    let tracklist = createTracklistContainer("recording-track");
    tracklist.id = "recording-tracklist";

    tracklist.options    = document.createElement("div");
    tracklist.options.id = "recording-tracklist-options";

    tracklist.shift           = document.createElement("button");
    tracklist.shift.innerText = "Shift names up";
    tracklist.shift.onclick   = e => tracklist.shiftTitlesUp();
    tracklist.options.append(tracklist.shift);

    tracklist.reapply           = document.createElement("button");
    tracklist.reapply.innerText = "Reapply names";
    tracklist.reapply.onclick   = e => tracklist.dispatchEvent(new CustomEvent("reapply-titles", { bubbles: true }));
    tracklist.options.append(tracklist.reapply);

    tracklist.append(tracklist.options);

    tracklist.toggleEdit = (editable) => {
        for (let track of tracklist.getElementsByClassName(tracklist.childClass))
            track.toggleEdit(editable);
        (editable) ?  tracklist.insertBefore(tracklist.options, tracklist.rawInfo) : tracklist.options.remove();
    }

    tracklist.setTracklist = (tracks) => {
        tracklist.clear();
        for (let track of tracks) {
            let entry = createRecordingTrack(track);
            let position = track.track_num - 1;
            entry.updatePosition(position, position == 0, position == tracks.length - 1);
            tracklist.insertBefore(entry, tracklist.options);
        }
    }

    tracklist.getTracklist = () => { return Array.from(tracklist.getElementsByClassName(tracklist.childClass)).map(item => item.track); }

    tracklist.shiftTitlesUp = () => {
        let original = Array.from(tracklist.getElementsByClassName(tracklist.childClass)).map(item => item.trackTitle.get());
        let newTitles = original.slice(1, original.length).concat("");
        tracklist.setTrackTitles(newTitles);
    }

    tracklist.setTrackTitles = (titles) => {
        let tracks = tracklist.getElementsByClassName(tracklist.childClass);
        for (let i = 0; i < tracks.length; i++) {
            let title = (i < titles.length) ? titles[i] : "";
            tracks.item(i).trackTitle.set(title);
        }
    }

    tracklist.save = () => {
        for (let track of tracklist.getElementsByClassName(tracklist.childClass))
            track.save();
    }

    return tracklist;
}

export { createRecordingTracklist };
