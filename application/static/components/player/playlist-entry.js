import { createTracklistContainer, createTracklistOption, addText } from "/static/components/shared/tracklist-container.js";
import { createTracklistControls } from "./controls.js";
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

export { createPlaylistEntry };
