import { Recording } from "/static/modules/recording.js";
import { PlaylistEntry } from "/static/components/playlist-entry.js";

customElements.define("playlist-entry", PlaylistEntry, { extends: "div" });

class PlayerContainer extends HTMLDivElement {
    constructor() {
        super();

        this.recordingApi = new Recording();

        this.id = "player-container";
        this.addEventListener("update-rating", e => this.updateRating(e.detail));
    }

    initialize() {
        this.currentTrack = document.getElementById("current-track");
        this.nextTracks = document.getElementById("next-tracks");
        this.recentlyPlayed = document.getElementById("recently-played");
    }

    update() {
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.updateState(JSON.parse(e.target.response)));
        request.open("GET", "/api/player");
        request.send();
    }

    updateState(state) {
        let current = state.current.track_data;
        this.currentTrack.setAttribute("filename", current.filename);
        this.currentTrack.setAttribute("track-title", current.title);
        (current.rating != null) ? this.currentTrack.setAttribute("rating", current.rating) : this.currentTrack.removeAttribute("rating");
        this.currentTrack.setAttribute("rating", current.rating);
        this.currentTrack.setAttribute("recording-id", current.recording_id);
        this.currentTrack.setAttribute("recording-title", current.recording);
        this.currentTrack.setAttribute("artist", current.artist);
        (current.artwork != null) ? this.currentTrack.setAttribute("artwork", current.artwork) : this.currentTrack.removeAttribute("artwork");
        this.currentTrack.update();
        this.updateTracklist(this.nextTracks, state.next_entries);
        this.updateTracklist(this.recentlyPlayed, state.recently_played);
    }

    updateTracklist(tracklist, items) {

        console.log(items);
        let tracks = tracklist.getElementsByClassName("playlist-entry");
        for (let track of tracks)
            track.remove();

        for (let trackNum in items) {
            let track = items[trackNum];
            let entry = document.createElement("div", { is: "playlist-entry" });
            entry.setAttribute("title", track.title);
            entry.setAttribute("recording", track.recording);
            entry.setAttribute("artist", track.artist);
            tracklist.append(entry);
            entry.initialize();
            if (trackNum == 0)
                tracklist.append(this.createToggle(items));
            else
                entry.style.display = "none";
        }
    }

    createToggle(items) {
        let expand = document.createElement("div");
        let more = items.length - 1;
        if (more == 1)
            expand.innerText = "expand (" + more + " more track)";
        else if (more > 1)
            expand.innerText = "expand (" + more + " more tracks)";
        expand.classList.add("expand-tracks");
        expand.onclick = e => {
            let toggle = e.target;
            if (toggle.innerText.startsWith("expand"))
                toggle.innerText = toggle.innerText.replace("expand", "collapse");
            else
                toggle.innerText = toggle.innerText.replace("collapse", "expand");

            let container = e.target.parentNode;
            for (let i = 3; i < container.children.length; i++) {
                let child = container.children.item(i);
                if (child.style.display == "none")
                    child.style.display = "contents";
                else
                    child.style.display = "none";
            }
        }
        return expand;
    }

    //should also update player state here
    updateRating(data) { this.recordingApi.updateRating(this.currentTrack.getAttribute("recording-id"), data); }
}

export { PlayerContainer };
