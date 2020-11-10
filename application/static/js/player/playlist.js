import { createTracklistControls } from "./controls.js";
import { createTracklistContainer, createTracklistOption, addText } from "../shared/tracklist-container.js";
import { createPlaylistEntry } from "../shared/playlist-entry.js";
import { createIcon } from "../shared/icons.js";
import { Task } from "../api.js";

function createPlaylist(api) {

    let tracklist = createTracklistContainer("playlist-entry");
    tracklist.id = "player-tracklist";

    tracklist.current = 0;
    tracklist.currentView = "nextTracks";
    tracklist.tracklistHidden = true;
    tracklist.tracks = [ ];
    tracklist.shuffle = null;
    tracklist.repeat = null;

    let heading = document.createElement("div");
    heading.classList.add("tracklist-heading");

    let view = document.createElement("div");
    view.id = "playlist-view";

    let headingClass = "tracklist-heading-option";
    let selectedClass = "tracklist-heading-selected";
    let updateView = (view) => function() {
        tracklist.currentView = view;
        tracklist.update(tracklist.tracks, tracklist.current, tracklist.shuffle, tracklist.repeat);
    };

    let nextTracksView = createTracklistOption("Next Tracks", headingClass, selectedClass, updateView("nextTracks"));
    nextTracksView.classList.add("tracklist-heading-selected");
    view.append(nextTracksView);

    let playlistView = createTracklistOption("All Tracks", headingClass, selectedClass, updateView("allTracks"));
    view.append(playlistView);

    heading.append(view);

    let controls = createTracklistControls(api);
    heading.append(controls);

    tracklist.append(heading);

    tracklist.listToggle = document.createElement("div");
    tracklist.listToggle.classList.add("list-toggle");
    tracklist.listToggle.onclick = e => {
        tracklist.tracklistHidden = !tracklist.tracklistHidden;
        tracklist.updateToggle();
    };

    tracklist.shiftTrackUp = (position) => {
        api.sendTasks([ new Task("move", { original: position, destination: position - 1 }) ]);
        tracklist._shiftTrackUp(position);
        tracklist.addToggle();
    }

    tracklist.removeTrack = (position) => {
        api.sendTasks([ new Task("remove", { position: position }) ]);
        tracklist._removeTrack(position);
        tracklist.addToggle();
    }

    tracklist.addToggle = () => {
        tracklist.listToggle.remove();
        let children = tracklist.getElementsByClassName(tracklist.childClass);
        if (children.length > 1)
            tracklist.insertBefore(tracklist.listToggle, children.item(1));
    }

    tracklist.updateToggle = () => {
        let entries = tracklist.getElementsByClassName(tracklist.childClass);
        let action = (tracklist.tracklistHidden) ? "Expand" : "Collapse";
        let more = entries.length - 1
        if (more > 1)
            tracklist.listToggle.innerText = action + " (" + more + " more tracks)";
        else if (more == 1)
            tracklist.listToggle.innerText = action + " (" + more + " more track)";
        else
            tracklist.listToggle.remove();
        
        if (entries.length > 1)
            for (let i = 1; i < entries.length; i++)
                entries.item(i).style.display = (tracklist.tracklistHidden) ? "none" : "contents";
    }

    tracklist.update = (tracks, current, shuffle, repeat) => {
        tracklist.tracks = tracks;
        tracklist.current = current;
        tracklist.shuffle = shuffle;
        tracklist.repeat = repeat;
        controls.updateIcons(shuffle, repeat);
        let entries = tracklist.tracks.map(track => createPlaylistEntry(tracklist, track));
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            entry.updatePosition(i, i == 0, i == entries.length - 1);
            if (tracklist.currentView == "allTracks" && i == current)
                entry.classList.add("playlist-entry-current");
            if (tracklist.currentView == "nextTracks" && i == current + 1) {
                entry.style["font-size"] = "large";
                entry.moveUp.hide();
            }
        }
        let displayEntries = (tracklist.currentView == "nextTracks") ? entries.slice(tracklist.current + 1, tracklist.length) : entries;
        tracklist._update(displayEntries);
        if (tracklist.currentView == "nextTracks") {
            tracklist.addToggle();
            tracklist.updateToggle();
        } else {
            tracklist.listToggle.remove();
        }
    }

    return tracklist;
}

export { createPlaylist };
