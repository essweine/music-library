import { createTracklistContainer, createTracklistOption, addText } from "/static/components/shared/tracklist-container.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createIcon, createTracklistEvent } from "/static/components/shared/icons.js";

function createPlaylistEntry(track) {

    let playlistEntry = document.createElement("div");
    playlistEntry.classList.add("playlist-entry");
    playlistEntry.track = track;

    playlistEntry.append(addText(track.title, "playlist-title"));
    playlistEntry.append(addText(track.recording, "playlist-recording"));
    playlistEntry.append(addText(track.artist, "playlist-artist"));

    playlistEntry.moveUp = createIcon("arrow_upward", e => playlistEntry.dispatchEvent(createTracklistEvent("move-track-up")), "move-up");
    playlistEntry.append(playlistEntry.moveUp);

    playlistEntry.moveDown = createIcon("arrow_downward", e => playlistEntry.dispatchEvent(createTracklistEvent("move-track-down")), "move-down");
    playlistEntry.append(playlistEntry.moveDown);

    playlistEntry.removeTrack = createIcon("clear", e => playlistEntry.dispatchEvent(createTracklistEvent("remove-track")), "remove-track");
    playlistEntry.append(playlistEntry.removeTrack);

    playlistEntry.addEventListener("tracklist-action", e => {

        let detail = {
            action: e.detail,
            position: playlistEntry.position,
            filename: playlistEntry.track.filename
        };
        playlistEntry.dispatchEvent(new CustomEvent("update-playlist", { detail: detail, bubbles: true }));

        if (e.detail == "move-track-up")
            playlistEntry.dispatchEvent(new CustomEvent("move-track", { detail: playlistEntry.position, bubbles: true }));
        else if (e.detail == "move-track-down")
            playlistEntry.dispatchEvent(new CustomEvent("move-track", { detail: playlistEntry.position + 1, bubbles: true }));
        else if (e.detail == "remove-track")
            playlistEntry.dispatchEvent(new CustomEvent("remove-track", { detail: playlistEntry.position, bubbles: true }));
    });

    playlistEntry.updatePosition = (position, firstTrack, lastTrack) => {
        playlistEntry.position = position;
        if (firstTrack) {
            playlistEntry.moveUp.hide();
            playlistEntry.moveDown.show();
        } else if (lastTrack) {
            playlistEntry.moveUp.show();
            playlistEntry.moveDown.hide();
        } else {
            playlistEntry.moveUp.show();
            playlistEntry.moveDown.show();
        }
    }

    return playlistEntry;
}

function createPlayerTracklist(childClass) {

    let tracklist = createTracklistContainer("playlist-entry");
    tracklist.id = "player-tracklist";

    tracklist.current = 0;
    tracklist.currentView = "nextTracks";
    tracklist.tracklistHidden = true;
    tracklist.tracks = [ ];

    let heading = document.createElement("div");
    heading.classList.add("tracklist-heading");

    let createEvent = (view) => { return new CustomEvent("update-view", { detail: view, bubbles: true }); };

    let nextTracksView = createTracklistOption("Next Tracks", "tracklist-heading-option", "tracklist-heading-selected", createEvent("nextTracks"));
    nextTracksView.classList.add("tracklist-heading-selected");
    heading.append(nextTracksView);

    let playlistView = createTracklistOption("All Tracks", "tracklist-heading-option", "tracklist-heading-selected", createEvent("allTracks"));
    heading.append(playlistView);

    tracklist.append(heading);

    tracklist.listToggle = document.createElement("div");
    tracklist.listToggle.classList.add("list-toggle");
    tracklist.listToggle.onclick = e => {
        tracklist.tracklistHidden = !tracklist.tracklistHidden;
        tracklist.updateToggle();
    };

    tracklist.shiftTrackUp = (position) => {
        tracklist._shiftTrackUp(position);
        tracklist.addToggle();
    }

    tracklist.removeTrack = (position) => {
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

    tracklist.update = (tracks, current) => {
        tracklist.tracks = tracks;
        tracklist.current = current;
        let entries = tracks.map(track => createPlaylistEntry(track));
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            entry.updatePosition(i, i == 0, i == entries.length - 1);
            if (tracklist.currentView == "allTracks" && i == current)
                entry.classList.add("playlist-entry-current");
            if (tracklist.currentView == "nextTracks" && i == current) {
                entry.style["font-size"] = "large";
                entry.moveUp.hide();
            }
        }
        let displayEntries = (tracklist.currentView == "nextTracks") ? entries.slice(tracklist.current, tracklist.length) : entries;
        tracklist._update(displayEntries);
        if (tracklist.currentView == "nextTracks") {
            tracklist.addToggle();
            tracklist.updateToggle();
        } else {
            tracklist.listToggle.remove();
        }

    }

    tracklist.addEventListener("update-view", e => { 
        tracklist.currentView = e.detail;
        tracklist.update(tracklist.tracks, tracklist.current);
    });

    return tracklist;
}

export { createPlayerTracklist };
