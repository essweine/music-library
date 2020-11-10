import { Api } from "./api.js";

import { createDirectoryList } from "./library/directory-list.js";
import { createRecordingList } from "./library/recording-list.js";
import { createPlaylistList } from "./library/playlist-list.js";
import { createPlaylistEditor } from "./library/playlist-editor.js";
import { createImportContainer, createRecordingContainer } from "./library/container.js";
import { createPlayerContainer } from "./player/container.js";
import { createHistoryContainer } from "./history-container.js";
import { createRadioContainer } from "./radio-container.js";
import { createLogManager } from "./log-manager.js";
import { createErrorDisplay } from "./error-display.js";

function Application(action, arg) {

    this.addContainer = (action, arg) => {
        if (action == "importer" && arg != null) {
            this.container = createImportContainer(this.api, arg);
        } else if (action == "importer") {
            this.container = createDirectoryList(this.api);
        } else if (action == "recording" && arg != null) {
            this.container = createRecordingContainer(this.api, arg);
        } else if (action == "recording") {
            this.container = createRecordingList(this.api);
        } else if (action == "history") {
            let ws = this.getNotificationService(this.api.playerNotification);
            this.container = createHistoryContainer(this.api, ws);
        } else if (action == "playlist" && arg != null) {
            this.container = createPlaylistEditor(this.api, arg);
        } else if (action == "playlist") {
            this.container = createPlaylistList(this.api);
        } else if (action == "radio") {
            this.container = createRadioContainer(this.api);
        } else if (action == "log") {
            let ws = this.getNotificationService(this.api.logNotification);
            this.container = createLogManager(ws);
        } else {
            let ws = this.getNotificationService(this.api.playerNotification);
            this.container = createPlayerContainer(this.api, ws);
        }
    }

    this.errorHandler = (messages) => {
        let container = createErrorDisplay(messages);
        this.content.replaceChild(container, this.container);
    }

    this.getNotificationService = (path) => {
        let wsUrl = "ws://" + location.host + path;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => { });
        return ws;
    }

    this.api = new Api(this.errorHandler.bind(this));
    this.content = document.getElementById("content");
    this.addContainer(action, arg);
    this.content.addEventListener("update-rating", ev => this.api.updateRating(ev.detail))
    this.content.append(this.container);
}

window.onload = e => {
    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : null
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : null
    let app = new Application(action, arg);
}
