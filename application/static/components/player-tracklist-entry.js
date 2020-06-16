import { createRatingContainer } from "/static/components/rating-container.js";
import { createIcon, createTracklistEvent } from "/static/components/icons.js";

function createPlaylistEntry(track, className) {

    let playlistEntry = document.createElement("div");

    playlistEntry.classList.add(className);
    playlistEntry.track = track;

    playlistEntry.trackTitle = document.createElement("span");
    playlistEntry.trackTitle.classList.add("playlist-title");
    playlistEntry.trackTitle.innerText = track.title;
    playlistEntry.append(playlistEntry.trackTitle);

    playlistEntry.recording = document.createElement("span");
    playlistEntry.recording.classList.add("playlist-recording");
    playlistEntry.recording.innerText = track.recording;
    playlistEntry.append(playlistEntry.recording);

    playlistEntry.artist = document.createElement("span");
    playlistEntry.artist.classList.add("playlist-artist");
    playlistEntry.artist.innerText = track.artist;
    playlistEntry.append(playlistEntry.artist);

    return playlistEntry;
}

function createNextTracksEntry(track) {

    let playlistEntry = createPlaylistEntry(track, "next-tracks-entry");

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

function createRecentlyPlayedEntry(track) {

    let playlistEntry = createPlaylistEntry(track, "recently-played-entry");

    playlistEntry.ratingContainer = createRatingContainer();
    playlistEntry.ratingContainer.configure(track.recording_id, track.filename, track.rating);
    playlistEntry.append(playlistEntry.ratingContainer);

    return playlistEntry;
}

export { createNextTracksEntry, createRecentlyPlayedEntry };
