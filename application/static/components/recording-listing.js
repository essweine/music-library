import { Recording } from "/static/modules/api.js";
import { Player } from "/static/modules/player.js";
import { RatingContainer, createRatingContainer } from "/static/components/rating-container.js";

customElements.define("rating-container", RatingContainer, { extends: "span" });

class RecordingListing extends HTMLDivElement {
    constructor() {
        super();

        this.classList.add("recording-listing");
        this.recordingId = this.getAttribute("recording-id");

        this.artist = document.createElement("span");
        this.artist.innerText = this.getAttribute("artist");
        this.artist.classList.add("list-artist");
        this.append(this.artist);

        this.recordingTitle = document.createElement("span");
        this.recordingTitle.innerText = this.getAttribute("title");
        this.recordingTitle.classList.add("list-title");
        this.append(this.recordingTitle);

        this.recordingDate = document.createElement("span");
        this.recordingDate.innerText = this.getAttribute("recording-date");
        this.recordingDate.classList.add("list-date");
        this.append(this.recordingDate);
        
        this.recordingRating = createRatingContainer();
        this.recordingRating.initialize(this.recordingId, "rating", this.getAttribute("rating"));
        this.append(this.recordingRating);
        
        this.soundRating = createRatingContainer();
        this.soundRating.initialize(this.recordingId, "sound-rating", this.getAttribute("sound-rating"));
        this.append(this.soundRating);
        
        this.actions = document.createElement("span");
        this.actions.classList.add("list-actions");

        this.actions.append(this.createIcon("library_music", e => this.visitAction()));
        this.actions.append(this.createIcon("playlist_play", e => this.playAll()));
        this.append(this.actions);
    }

    createIcon(iconName, action) {
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add("list-icon");
        icon.onclick = action;
        return icon;
    }

    visitAction() { window.location.href = "/recording/" + this.recordingId; }

    playAll() {
        let recordingApi = new Recording(this.recordingId);
        recordingApi.get(Player.playAll.bind(Player));
    }
}

export { RecordingListing };
