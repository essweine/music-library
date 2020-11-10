import { createTracklistContainer, createTracklistOption, addText } from "./tracklist-container.js";
import { createIcon } from "./icons.js";

function createPlaylistEntry(playlist, track) {

    let playlistEntry = document.createElement("div");
    playlistEntry.classList.add("tracklist-entry");
    playlistEntry.classList.add("playlist-entry");
    playlistEntry.track = track;

    playlistEntry.append(addText(track.title, "playlist-title"));
    playlistEntry.append(addText(track.recording, "playlist-recording"));
    playlistEntry.append(addText(track.artist, "playlist-artist"));

    playlistEntry.moveUp = createIcon("arrow_upward", e => playlist.shiftTrackUp(playlistEntry.position), "playlist-move-up");
    playlistEntry.append(playlistEntry.moveUp);

    playlistEntry.moveDown = createIcon("arrow_downward", e => playlist.shiftTrackUp(playlistEntry.position + 1), "playlist-move-down");
    playlistEntry.append(playlistEntry.moveDown);

    playlistEntry.removeTrack = createIcon("clear", e => playlist.removeTrack(playlistEntry.position), "playlist-remove-track");
    playlistEntry.append(playlistEntry.removeTrack);

    playlistEntry.updatePosition = (position, firstTrack, lastTrack) => {
        playlistEntry.position = position;
        if (firstTrack && lastTrack) {
            playlistEntry.moveUp.hide();
            playlistEntry.moveDown.hide();
        } else if (firstTrack) {
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
