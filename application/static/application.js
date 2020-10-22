import { Importer, Recording, Player, Rating, Search, History, Station } from "/static/modules/api.js";

import { createDirectoryList } from "/static/components/library/directory-list.js";
import { createRecordingList } from "/static/components/library/recording-list.js";
import { createImportContainer, createRecordingContainer } from "/static/components/library/container.js";
import { createPlayerContainer } from "/static/components/player/container.js";
import { createHistoryContainer } from "/static/components/history-container.js";
import { createRadioContainer } from "/static/components/radio-container.js";
import { createLogManager } from "/static/components/log-manager.js";
import { createErrorDisplay } from "/static/components/error-display.js";

class Application {

    constructor(action, arg) {

        this.importerApi  = new Importer(this.errorHandler.bind(this));
        this.recordingApi = new Recording(this.errorHandler.bind(this));
        this.playerApi    = new Player(this.errorHandler.bind(this));
        this.ratingApi    = new Rating(this.errorHandler.bind(this));
        this.searchApi    = new Search(this.errorHandler.bind(this));
        this.historyApi   = new History(this.errorHandler.bind(this));
        this.stationApi   = new Station(this.errorHandler.bind(this));

        this.content = document.getElementById("content");
        this.addContainer(action, arg);

        this.content.addEventListener("update-rating", ev => this.ratingApi.update(ev.detail))

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
            this.searchApi.getSearchConfig("recording", this.container.configureSearch);
            this.recordingApi.listAll(this.container.addRows);
        } else if (action == "history") {
            let ws = this.getPlayerNotificationService();
            createHistoryContainer(this, ws);
            this.historyApi.getRecentTracks(this.container.tracklist.period, this.container.tracklist.update);
        } else if (action == "radio") {
            createRadioContainer(this);
            this.searchApi.getSearchConfig("station", this.container.stationList.configureSearch);
            this.stationApi.listAll(this.container.stationList.addRows);
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
