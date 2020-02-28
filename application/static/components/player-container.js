import { Recording } from "/static/modules/recording.js";
import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/playlist-entry.js";

class PlayerContainer extends HTMLDivElement {
    constructor() {
        super();

        this.id = "player-container";
        this.addEventListener("update-rating", e => this.updateRating(e.detail));

        this.recordingApi = new Recording();
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

        this.nextTracks.update(state.next_entries);
        this.recentlyPlayed.update(state.recently_played);
    }

    //should also update player state here
    updateRating(data) { this.recordingApi.updateRating(this.currentTrack.getAttribute("recording-id"), data); }
}

export { PlayerContainer };
