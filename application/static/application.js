import { Importer, Recording, Player } from "/static/modules/api.js";

import { createDirectoryList, createRecordingList } from "/static/components/item-list.js";
import { createImportContainer, createRecordingContainer } from "/static/components/recording-container.js";
import { createPlayerContainer } from "/static/components/player-container.js";
import { createLogManager } from "/static/components/log-manager.js";

class Application {

    constructor(action, arg) {

        this.importerApi = new Importer();
        this.recordingApi = new Recording();
        this.playerApi = new Player();

        this.content = document.getElementById("content");
        this.container = this.selectContainer(action, arg);
        this.content.append(this.container);

        this.content.addEventListener("play-track", e => this.playerApi.play(e.detail));
        this.content.addEventListener("play-tracks", e => this.playerApi.playAll(e.detail));
        this.content.addEventListener("play-recording", 
            e => this.recordingApi.getRecording(e.detail, this.playerApi.playRecording.bind(this.playerApi)));

        this.content.addEventListener("queue-track", e => this.playerApi.queue(e.detail));
        this.content.addEventListener("queue-tracks", e => this.playerApi.queueAll(e.detail));
        this.content.addEventListener("queue-recording", 
            e => this.recordingApi.getRecording(e.detail, this.playerApi.queueRecording.bind(this.playerApi)));

        this.content.addEventListener("add-recording", e => this.recordingApi.addToLibrary(e.detail));
        this.content.addEventListener("save-recording", e => this.recordingApi.saveRecording(e.detail));

        this.content.addEventListener("update-rating", e => {
            let recordingId = e.detail.recordingId;
            let data = e.detail.data;
            this.recordingApi.updateRating(recordingId, data);
        });

        this.content.addEventListener("expand-tracks", e => this.recordingApi.getRecording(e.detail, this.container.expandRow));
        this.content.addEventListener("collapse-tracks", e => this.container.collapseRow(e.detail));
    }

    selectContainer(action, arg) {
        if (action == "importer" && arg != null) {
            let container = createImportContainer();
            this.importerApi.getDirectoryListing(arg, container.initialize);
            return container;
        } else if (action == "importer") {
            let container = createDirectoryList("directory-list-root");
            this.importerApi.listAll(container.addRows);
            return container;
        } else if (action == "recording" && arg != null) {
            let container = createRecordingContainer();
            this.recordingApi.getRecording(arg, container.initialize);
            return container;
        } else if (action == "recording") {
            let container = createRecordingList("recording-list-root");
            this.recordingApi.listAll(container.addRows);
            return container;
        } else if (action == "log") {
            let container = createLogManager();
            this.createLogNotificationService(container);
            return container;
        } else {
            let container = createPlayerContainer();
            this.createPlayerNotificationService(container);
            return container;
        }
    }

    createPlayerNotificationService(playerContainer) {

        let wsUrl = "ws://" + location.host + this.playerApi.wsUrl;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => ws.send("open"));
        ws.addEventListener("message", e => this.playerApi.getCurrentState(playerContainer.update));

        this.content.addEventListener("player-control", e => {
            if (e.detail == "stop") {
                this.playerApi.stop();
            } else if (e.detail == "pause") {
                this.playerApi.pause();
            } else if (e.detail == "start") {
                this.playerApi.start();
            } else if (e.detail == "back") {
                // This will go back to the beginning of the track, but not through the playlist.
                // I might have to rethink how the playlist would work.
                let addTask = this.playerApi.createTask("add", playerContainer.current.filename, 0);
                this.playerApi.sendTasks([ addTask, this.playerApi.stopTask, this.playerApi.startTask ]);
            } else if (e.detail == "next") {
                this.playerApi.advance();
            }
        });

        this.content.addEventListener("update-playlist", e => {
            if (e.detail.action == "move-track-up") {
                this.playerApi.sendTasks([
                    this.playerApi.createTask("remove", null, e.detail.position),
                    this.playerApi.createTask("add", e.detail.filename, e.detail.position - 1)
                ]);
            } else if (e.detail.action == "move-track-down") {
                this.playerApi.sendTasks([
                    this.playerApi.createTask("remove", null, e.detail.position),
                    this.playerApi.createTask("add", e.detail.filename, e.detail.position + 1)
                ]);
            } else if (e.detail.action == "remove-track") {
                this.playerApi.sendTasks([ this.playerApi.createTask("remove", null, e.detail.position) ]);
            }
        });
    }

    createLogNotificationService(logManager) {
        let wsUrl = "ws://" + location.host + "/api/log/notifications";
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => ws.send(""));
        ws.addEventListener("message", e => logManager.update(JSON.parse(e.data)));
    }
}

window.onload = e => {

    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : null
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : null

    let app = new Application(action, arg);
}
