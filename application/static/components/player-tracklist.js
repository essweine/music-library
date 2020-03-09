import { TracklistContainer } from "/static/components/tracklist-container.js";
import { UpArrow, DownArrow } from "/static/components/move-button.js";
import { RemoveButton } from "/static/components/remove-button.js";
import { RatingContainer } from "/static/components/rating-container.js";
import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/player-tracklist-entry.js";

customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });
customElements.define("rating-container", RatingContainer, { extends: "span" });
customElements.define("next-tracks-entry", NextTracksEntry, { extends: "div" });
customElements.define("recently-played-entry", RecentlyPlayedEntry, { extends: "div" });

class PlaylistTrackContainer extends TracklistContainer {

    constructor() {
        super();

        this.tracklistHidden = true;
        this.listToggle = document.createElement("div");
        this.listToggle.classList.add("list-toggle");
        this.listToggle.onclick = e => {
            this.tracklistHidden = !this.tracklistHidden;
            this.updateToggle();
        };
    }

    update(tracklist) {
        super.update(tracklist);
        this.addToggle();
        this.updateToggle();
    }

    shiftTrackUp(position) {
        super.shiftTrackUp(position);
        this.addToggle();
    }

    removeTrack(position) {
        super.removeTrack(position);
        this.addToggle();
    }

    addToggle() {
        this.listToggle.remove();
        let children = this.getElementsByClassName(this.childClass);
        if (children.length > 1)
            this.insertBefore(this.listToggle, children.item(1));
    }

    updateToggle() {
        let tracklist = this.getElementsByClassName(this.childClass);
        let action = (this.tracklistHidden) ? "Expand" : "Collapse";
        let more = tracklist.length - 1
        if (more > 1)
            this.listToggle.innerText = action + " (" + more + " more tracks)";
        else if (more == 1)
            this.listToggle.innerText = action + " (" + more + " more track)";
        else
            this.listToggle.remove();
        
        if (tracklist.length > 1)
            for (let i = 1; i < tracklist.length; i++)
                tracklist.item(i).style.display = (this.tracklistHidden) ? "none" : "contents";
    }
}

class NextTracksContainer extends PlaylistTrackContainer {
    constructor() {
        super();
        this.id = "next-tracks";
        this.childClass = "next-tracks-entry";
        this.childAttributes = [ "title", "recording", "artist", "filename" ];
    }

    initialize() { }

    update(tracklist) { super.update(tracklist); }

    shiftTrackUp(position) {
        super.shiftTrackUp(position);
    }

    removeTrack(position) {
        super.removeTrack(position);
    }
}

class RecentlyPlayedContainer extends PlaylistTrackContainer {
    constructor() {
        super();
        this.id = "recently-played";
        this.childClass = "recently-played-entry";
        this.childAttributes = [ "title", "recording", "artist", "recording-id", "filename", "rating" ];
    }

    initialize() { }

    update(tracklist) { super.update(tracklist); }
}

export { NextTracksContainer, RecentlyPlayedContainer };
