class PlayerContainer extends HTMLDivElement {
    constructor() {
        super();
        this.id = "player-container";
        this.current = null;

        this.addEventListener("player-control", e => {
            if (e.detail == "stop") {
                this.player.sendTasks([ this.player.stopTask ]);
            } else if (e.detail == "pause") {
                this.player.sendTasks([ this.player.pauseTask ]);
            } else if (e.detail == "start") {
                this.player.sendTasks([ this.player.startTask ]);
            } else if (e.detail == "back") {
                // This will go back to the beginning of the track, but not through the playlist.
                // I might have to rethink how the playlist would work.
                let addTask = this.player.addToPlaylistTask(this.current.filename, 0);
                this.player.sendTasks([ addTask, this.player.stopTask, this.player.startTask ]);
            } else if (e.detail == "next") {
                this.player.sendTasks([ this.player.stopTask, this.player.startTask ]);
            }
        });

        this.addEventListener("update-playlist", e => {
            if (e.detail.action == "move-track-up") {
                this.player.sendTasks([
                    this.player.removeFromPlaylistTask(null, e.detail.position),
                    this.player.addToPlaylistTask(e.detail.filename, e.detail.position - 1)
                ]);
            } else if (e.detail.action == "move-track-down") {
                this.player.sendTasks([
                    this.player.removeFromPlaylistTask(null, e.detail.position),
                    this.player.addToPlaylistTask(e.detail.filename, e.detail.position + 1)
                ]);
            } else if (e.detail.action == "remove-track") {
                this.player.sendTasks([ this.player.removeFromPlaylistTask(null, e.detail.position) ]);
            }
        });
    }

    initialize(player) {
        this.currentTrack = document.getElementById("current-track");
        this.nextTracks = document.getElementById("next-tracks");
        this.recentlyPlayed = document.getElementById("recently-played");
        this.playerControls = document.getElementById("player-controls");
        this.player = player;
    }

    update() {
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.updateState(JSON.parse(e.target.response)));
        request.open("GET", "/api/player");
        request.send();
    }

    updateState(state) {
        this.elapsed = state.elapsed;
        this.current = state.current;
        this.previous = state.recently_played[0];
        let current = state.current;
        if (current != null) {
            this.currentTrack.setAttribute("filename", current.filename);
            this.currentTrack.setAttribute("track-title", current.title);
            (current.rating != null) ? this.currentTrack.setAttribute("rating", current.rating) : this.currentTrack.removeAttribute("rating");
            this.currentTrack.setAttribute("recording-id", current.recording_id);
            this.currentTrack.setAttribute("recording-title", current.recording);
            this.currentTrack.setAttribute("artist", current.artist);
            (current.artwork != null) ? this.currentTrack.setAttribute("artwork", current.artwork) : this.currentTrack.removeAttribute("artwork");
            this.currentTrack.update();
            this.insertBefore(this.currentTrack, this.playerControls);
        } else {
            this.currentTrack.remove();
        }
        this.nextTracks.update(state.next_entries);
        this.recentlyPlayed.update(state.recently_played);
    }
}

export { PlayerContainer };
