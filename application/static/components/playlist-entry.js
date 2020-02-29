import { UpArrow, DownArrow } from "/static/components/move-button.js";
import { RemoveButton } from "/static/components/remove-button.js";

customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });

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

    update() {
    }
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
            let detail = (e.detail == "up") ? position : position + 1;
            let ev = new CustomEvent("move-track", { detail: detail, bubbles: true });
            this.dispatchEvent(ev);
        });

        this.addEventListener("remove", e => {
            let position = parseInt(this.getAttribute("position"));
            let ev = new CustomEvent("remove-track", { detail: position, bubbles: true });
            this.dispatchEvent(ev);
        });
    }

    initialize() { super.initialize(); }

    update (position, firstTrack, lastTrack) {
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
        this.ratingContainer = document.createElement("span", { is: "rating-container" });
        this.ratingContainer.addEventListener("rating-change", e => 
            this.ratingContainer.sendRating(this, this.getAttribute("recording-id"), this.getAttribute("filename"), e.detail));
        this.append(this.ratingContainer);
    }

    update() {
    }
}

export { NextTracksEntry, RecentlyPlayedEntry };
