import { createTracklistContainer } from "/static/components/shared/tracklist-container.js";
import { createRecordingTrack } from "./tracklist-entry.js";

function createRecordingTracklist(container) {

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
    tracklist.reapply.onclick   = e => {
        let original = container.source.tracks.map(item => item.title);
        container.tracklist.setTrackTitles(original);
    }
    tracklist.options.append(tracklist.reapply);

    tracklist.append(tracklist.options);

    tracklist.toggleEdit = (editable) => {
        for (let track of tracklist.getItems())
            track.toggleEdit(editable);
        (editable) ? tracklist.insertBefore(tracklist.options, tracklist.rawInfo) : tracklist.options.remove();
    }

    tracklist.setTracklist = (tracks) => {
        tracklist.clear();
        for (let track of tracks) {
            let entry = createRecordingTrack(tracklist, track);
            let position = track.track_num - 1;
            entry.updatePosition(position, position == 0, position == tracks.length - 1);
            tracklist.insertBefore(entry, tracklist.options);
        }
    }

    tracklist.getTracklist = () => { return Array.from(tracklist.getItems()).map(item => item.track); }

    tracklist.getAllValues = (property) => {
        let values = new Set();
        tracklist.getTracklist().map(track => track[property].map(value => values.add(value)));
        return Array.from(values);
    }

    tracklist.shiftTitlesUp = () => {
        let original = Array.from(tracklist.getItems()).map(item => item.trackTitle.get());
        let newTitles = original.slice(1, original.length).concat("");
        tracklist.setTrackTitles(newTitles);
    }

    tracklist.setTrackTitles = (titles) => {
        let tracks = tracklist.getItems();
        for (let i = 0; i < tracks.length; i++) {
            let title = (i < titles.length) ? titles[i] : "";
            tracks.item(i).trackTitle.set(title);
        }
    }

    tracklist.addProperty = (property, value) => {
        for (let track of tracklist.getItems())
            track.addProperty(property, value);
    }

    tracklist.removeProperty = (property, value) => {
        for (let track of tracklist.getItems())
            track.removeProperty(property, value);
    }

    tracklist.save = () => {
        for (let track of tracklist.getItems())
            track.save();
    }

    return tracklist;
}

export { createRecordingTracklist };
