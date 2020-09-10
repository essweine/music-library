import { createTracklistContainer, createTracklistOption, addText } from "/static/components/shared/tracklist-container.js";
import { createTracklistControls } from "./controls.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createIcon } from "/static/components/shared/icons.js";

function createPlaylistEntry(playlist, track) {

    let playlistEntry = document.createElement("div");
    playlistEntry.classList.add("playlist-entry");
    playlistEntry.track = track;

    playlistEntry.append(addText(track.title, "playlist-title"));
    playlistEntry.append(addText(track.recording, "playlist-recording"));
    playlistEntry.append(addText(track.artist, "playlist-artist"));

    playlistEntry.moveUp = createIcon("arrow_upward", e => playlist.shiftTrackUp(playlistEntry.position), "move-up");
    playlistEntry.append(playlistEntry.moveUp);

    playlistEntry.moveDown = createIcon("arrow_downward", e => playlist.shiftTrackUp(playlistEntry.position + 1), "move-down");
    playlistEntry.append(playlistEntry.moveDown);

    playlistEntry.removeTrack = createIcon("clear", e => playlist.removeTrack(playlistEntry.position), "remove-track");
    playlistEntry.append(playlistEntry.removeTrack);

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
