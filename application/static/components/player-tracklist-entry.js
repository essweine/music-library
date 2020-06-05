import { createRatingContainer } from "/static/components/rating-container.js";

class PlaylistEntry extends HTMLDivElement {

    constructor() {
        super();
        this.track;

        this.trackTitle = document.createElement("span");
        this.trackTitle.classList.add("playlist-title");
        this.append(this.trackTitle);

        this.recording = document.createElement("span");
        this.recording.classList.add("playlist-recording");
        this.append(this.recording);

        this.artist = document.createElement("span");
        this.artist.classList.add("playlist-artist");
        this.append(this.artist);
    }

    updatePosition() { };
}

class NextTracksEntry extends PlaylistEntry {

    constructor() {
        super();
        this.classList.add("next-tracks-entry");
        this.position;

        this.moveUp = document.createElement("span", { is: "up-arrow" });
        this.append(this.moveUp);

        this.moveDown = document.createElement("span", { is: "down-arrow" });
        this.append(this.moveDown);

        this.removeTrack = document.createElement("span", { is: "remove-button" });
        this.append(this.removeTrack);

        this.addEventListener("tracklist-action", e => {

            let detail = {
                action: e.detail,
                position: this.position,
                filename: this.track.filename
            };
            this.dispatchEvent(new CustomEvent("update-playlist", { detail: detail, bubbles: true }));

            if (e.detail == "move-track-up")
                this.dispatchEvent(new CustomEvent("move-track", { detail: this.position, bubbles: true }));
            else if (e.detail == "move-track-down")
                this.dispatchEvent(new CustomEvent("move-track", { detail: this.position + 1, bubbles: true }));
            else if (e.detail == "remove-track")
                this.dispatchEvent(new CustomEvent("remove-track", { detail: this.position, bubbles: true }));

        });
    }

    updatePosition (position, firstTrack, lastTrack) {
        this.position = position;
        if (firstTrack) {
            this.moveUp.hide();
            this.moveDown.show();
        } else if (lastTrack) {
            this.moveUp.show();
            this.moveDown.hide();
        } else {
            this.moveUp.show();
            this.moveDown.show();
        }
    }
}

class RecentlyPlayedEntry extends PlaylistEntry {
    constructor() {
        super();
        this.classList.add("recently-played-entry");

        this.ratingContainer = createRatingContainer();
        this.append(this.ratingContainer);
    }

    updatePosition() { }
}

function createPlaylistTrack(track, trackType) {
    let playlistTrack = document.createElement("div", { is: trackType });
    playlistTrack.track = track;
    playlistTrack.trackTitle.innerText = track.title;
    playlistTrack.recording.innerText = track.recording;
    playlistTrack.artist.innerText = track.artist;
    if (trackType == "recently-played-entry")
        playlistTrack.ratingContainer.initialize(track.recording_id, track.filename, track.rating);
    return playlistTrack;
}

export { NextTracksEntry, RecentlyPlayedEntry, createPlaylistTrack };
