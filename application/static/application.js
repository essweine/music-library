import { Importer, Recording, Player, Search, History } from "/static/modules/api.js";

import { createDirectoryList, createRecordingList } from "/static/components/library/item-list.js";
import { createImportContainer, createRecordingContainer } from "/static/components/library/recording-container.js";
import { createPlayerContainer } from "/static/components/player/player-container.js";
import { createHistoryContainer } from "/static/components/history-container.js";
import { createLogManager } from "/static/components/log-manager.js";
import { createErrorDisplay } from "/static/components/error-display.js";

class Application {

    constructor(action, arg) {

        this.importerApi  = new Importer(this.errorHandler.bind(this));
        this.recordingApi = new Recording(this.errorHandler.bind(this));
        this.playerApi    = new Player(this.errorHandler.bind(this));
        this.searchApi    = new Search(this.errorHandler.bind(this));
        this.historyApi   = new History(this.errorHandler.bind(this));

        this.content = document.getElementById("content");
        this.addContainer(action, arg);

        this.content.addEventListener("update-rating", ev => {
            let recordingId = ev.detail.recordingId;
            let data = ev.detail.data;
            this.recordingApi.updateRating(recordingId, data);
        });

        this.content.append(this.container);
    }

    addContainer(action, arg) {
        if (action == "importer" && arg != null) {
            createImportContainer(this);
            this.importerApi.getDirectoryListing(arg, this.container.initialize);
        } else if (action == "importer") {
            createDirectoryList(this);
            this.importerApi.listAll(this.container.addRows);
        } else if (action == "recording" && arg != null) {
            createRecordingContainer(this);
            this.recordingApi.getRecording(arg, this.container.initialize);
        } else if (action == "recording") {
            createRecordingList(this);
            this.recordingApi.listAll(this.container.addRows);
        } else if (action == "history") {
            let ws = this.getPlayerNotificationService();
            createHistoryContainer(this, ws);
            this.historyApi.getRecentTracks(this.container.recent.period, this.container.recent.update);
        } else if (action == "log") {
            let ws = this.getLogNotificationService();
            createLogManager(this, ws);
        } else {
            let ws = this.getPlayerNotificationService();
            createPlayerContainer(this, ws);
        }
    }

    errorHandler(messages) {
        let container = createErrorDisplay(messages);
        this.content.replaceChild(container, this.container);
    }

    getPlayerNotificationService() {
        let wsUrl = "ws://" + location.host + this.playerApi.wsUrl;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => { });
        return ws;
    }

    getLogNotificationService() {
        let wsUrl = "ws://" + location.host + "/api/log/notifications";
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => { });
        return ws;
    }
}

window.onload = e => {

    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : null
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : null
    let app = new Application(action, arg);
}
