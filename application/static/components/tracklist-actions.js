class TracklistAction extends HTMLSpanElement {

    constructor() {
        super();
        this.classList.add("material-icons");
        this.onclick = e => this.createEvent();
    }

    show() { this.style.display = "inline"; }
    hide() { this.style.display = "none"; }

    createEvent() { this.dispatchEvent(new CustomEvent("tracklist-action", { detail: this.detail, bubbles: true })); }
}

class UpArrow extends TracklistAction {
    constructor() {
        super();
        this.innerText = "arrow_upward";
        this.detail     = "move-track-up";
        this.classList.add("move-up");
    }
}

class DownArrow extends TracklistAction {
    constructor() {
        super();
        this.innerText = "arrow_downward";
        this.detail    = "move-track-down";
        this.classList.add("move-down");
    }
}

class RemoveTrackIcon extends TracklistAction {

    constructor() {
        super();
        this.innerText = "clear";
        this.detail    = "remove-track";
        this.classList.add("remove");
    }
}

class PlayTrackIcon extends TracklistAction {
    constructor() {
        super();
        this.innerText = "play_arrow";
        this.detail    = "play-track";
        this.classList.add("play-track");
    }
}

class QueueTrackIcon extends TracklistAction {
    constructor() {
        super();
        this.innerText = "playlist_add";
        this.detail    = "queue-track";
        this.classList.add("queue-track");
    }
}

export { UpArrow, DownArrow, RemoveTrackIcon, PlayTrackIcon, QueueTrackIcon };
