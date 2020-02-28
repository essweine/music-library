import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/playlist-entry.js";

customElements.define("next-tracks-entry", NextTracksEntry, { extends: "div" });
customElements.define("recently-played-entry", RecentlyPlayedEntry, { extends: "div" });

class PlaylistContainer extends HTMLDivElement {
    constructor() {
        super();

        this.addEventListener("move-track", e => this.shiftTrackUp(e.detail));
        this.addEventListener("remove-track", e => this.removeTrack(e.detail));

        this.tracklistHidden = true;
        this.listToggle = document.createElement("div");
        this.listToggle.classList.add("list-toggle");
        this.listToggle.onclick = e => {
            this.updateToggle();
            this.tracklistHidden = !this.tracklistHidden;
        };
    }

    initialize() { }

    update(tracklist) { 
        let children = this.getElementsByClassName(this.childClass);
        for (let track of children)
            track.remove();

        for (let position in tracklist) {
            let track = tracklist[position];
            let entry = document.createElement("div", { is: this.childClass });
            entry.setAttribute("title", track.title);
            entry.setAttribute("recording", track.recording);
            entry.setAttribute("artist", track.artist);
            entry.setAttribute("filename", track.filename);
            if (track.rating)
                entry.setAttribute("rating", track.rating);
            entry.initialize();
            entry.update(position, position == 0, position == tracklist.length - 1);
            this.append(entry);
        }
  
        this.moveToggle(children);
        this.updateToggle();
    }

    shiftTrackUp(position) {
        let children = this.getElementsByClassName(this.childClass);
        let item = children.item(position);
        let prev = children.item(position - 1);
        this.removeChild(item);
        this.insertBefore(item, prev);
        item.update(position - 1, position - 1 == 0, position - 1 == children.length - 1);
        prev.update(position, position == 0, position == children.length - 1);
        this.moveToggle(children);
    }

    removeTrack(position) {
        let children = this.getElementsByClassName(this.childClass);
        children.item(position).remove();
        for (let i = position; i < tracklist.length; i++)
            children.item(i).update(i, i == 0, i == children.length - 1);
        this.moveToggle(children);
    }

    moveToggle(children) {
        this.listToggle.remove();
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

class NextTracksContainer extends PlaylistContainer {
    constructor() {
        super();
        this.id = "next-tracks";
        this.childClass = "next-tracks-entry";
    }

    initialize() { }

    update(tracklist) {
        super.update(tracklist);
    }
}

class RecentlyPlayedContainer extends PlaylistContainer {
    constructor() {
        super();
        this.id = "recently-played";
        this.childClass = "recently-played-entry";
    }

    initialize() { }

    update(tracklist) {
        super.update(tracklist);
    }
}

export { NextTracksContainer, RecentlyPlayedContainer };
