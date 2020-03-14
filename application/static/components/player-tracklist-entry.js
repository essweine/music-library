import { createRatingContainer } from "/static/components/rating-container.js";

class PlaylistEntry extends HTMLDivElement {

    constructor() {
        super();

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

    initialize() {
        this.trackTitle.innerText = this.getAttribute("title");
        this.recording.innerText = this.getAttribute("recording");
        this.artist.innerText = this.getAttribute("artist");
    }

    updatePosition() { };
}

class NextTracksEntry extends PlaylistEntry {

    constructor() {
        super();
        this.classList.add("next-tracks-entry");

        this.moveUp = document.createElement("span", { is: "up-arrow" });
        this.moveUp.classList.add("move-up");
        this.append(this.moveUp);

        this.moveDown = document.createElement("span", { is: "down-arrow" });
        this.moveDown.classList.add("move-down");
        this.append(this.moveDown);

        this.removeTrack = document.createElement("span", { is: "remove-button" });
        this.removeTrack.classList.add("remove-track");
        this.append(this.removeTrack);

        this.addEventListener("move", e => {
            let position = parseInt(this.getAttribute("position"));
            let update = {
                action: (e.detail == "up") ? "move-track-up" : "move-track-down",
                position: position,
                filename: this.getAttribute("filename")
            };
            this.dispatchEvent(new CustomEvent("update-playlist", { detail: update, bubbles: true }));
            let listPosition = (e.detail == "up") ? position : position + 1;
            this.dispatchEvent(new CustomEvent("move-track", { detail: listPosition, bubbles: true }));
        });

        this.addEventListener("remove", e => {
            let position = parseInt(this.getAttribute("position"));
            let update = { action: "remove-track", position: position };
            this.dispatchEvent(new CustomEvent("update-playlist", { detail: update, bubbles: true }));
            this.dispatchEvent(new CustomEvent("remove-track", { detail: position, bubbles: true }));
        });
    }

    initialize() { super.initialize(); }

    updatePosition (position, firstTrack, lastTrack) {
        this.setAttribute("position", position);
        if (firstTrack) {
            this.querySelector("[class~='move-up']").style.display = "none";
            this.querySelector("[class~='move-down']").style.display = "inline";
        } else if (lastTrack) {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "none";
        } else {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "inline";
        }
    }
}

class RecentlyPlayedEntry extends PlaylistEntry {
    constructor() {
        super();
        this.classList.add("recently-played-entry");
    }

    initialize() {
        super.initialize();
        this.ratingContainer = createRatingContainer();
        this.ratingContainer.initialize(this.getAttribute("recording-id"), this.getAttribute("filename"), this.getAttribute("rating"));
        this.append(this.ratingContainer);
    }

    updatePosition() { }
}

export { NextTracksEntry, RecentlyPlayedEntry };
