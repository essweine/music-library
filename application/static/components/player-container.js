import { Player } from "/static/modules/api.js";

class PlayerContainer extends HTMLDivElement {
    constructor() {
        super();
        this.id = "player-container";
        this.playerApi = new Player();

        let wsUrl = "ws://" + location.host + this.playerApi.wsUrl;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => ws.send("open"));
        ws.addEventListener("message", e => this.update());

        this.currentTrack = document.createElement("div", { is: "current-track" });
        this.playerControls = document.createElement("div", { is: "player-controls" });
        this.nextTracks = document.createElement("div", { is: "next-tracks" });
        this.recentlyPlayed = document.createElement("div", { is: "recently-played" });

        for (let elem of [ this.currentTrack, this.playerControls, this.nextTracks, this.recentlyPlayed ])
            this.append(elem);

        this.current = null;

        this.addEventListener("player-control", e => {
            if (e.detail == "stop") {
                this.playerApi.stop();
            } else if (e.detail == "pause") {
                this.playerApi.pause();
            } else if (e.detail == "start") {
                this.playerApi.start();
            } else if (e.detail == "back") {
                // This will go back to the beginning of the track, but not through the playlist.
                // I might have to rethink how the playlist would work.
                let addTask = this.playerApi.createTask("add", this.current.filename, 0);
                this.playerApi.sendTasks([ addTask, this.playerApi.stopTask, this.playerApi.startTask ]);
            } else if (e.detail == "next") {
                this.playerApi.advance();
            }
        });

        this.addEventListener("update-playlist", e => {
            if (e.detail.action == "move-track-up") {
                this.player.sendTasks([
                    this.playerApi.createTask("remove", null, e.detail.position),
                    this.playerApi.createTask("add", e.detail.filename, e.detail.position - 1)
                ]);
            } else if (e.detail.action == "move-track-down") {
                this.player.sendTasks([
                    this.playerApi.createTask("remove", null, e.detail.position),
                    this.playerApi.createTask("add", e.detail.filename, e.detail.position + 1)
                ]);
            } else if (e.detail.action == "remove-track") {
                this.playerApi.sendTasks([ this.playerApi.createTask("remove", null, e.detail.position) ]);
            }
        });
    }

    update() { this.playerApi.getCurrentState(this.updateState.bind(this)); }

    updateState(state) {
        this.elapsed = state.elapsed;
        this.current = state.current;
        this.previous = state.recently_played[0];
        let current = state.current;
        if (current != null) {
            this.currentTrack.update(current);
            this.insertBefore(this.currentTrack, this.playerControls);
        } else {
            this.currentTrack.remove();
        }
        this.nextTracks.update(state.next_entries);
        this.recentlyPlayed.update(state.recently_played);
    }
}

export { PlayerContainer };
