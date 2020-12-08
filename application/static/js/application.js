import { Api } from "./api.js";

import { ErrorDisplay, LogManager } from "./errors.js";
import { DirectoryList } from "./library/directory.js";
import { RecordingList } from "./library/recording-list.js";
import { RecordingDisplay, ImportDisplay } from "./library/recording.js";
import { RatingManager } from "./library/rating-manager.js";
import { PlaylistList, PlaylistEditor } from "./library/playlist.js";
import { RadioContainer } from "./library/radio.js";
import { Player } from "./player/container.js";
import { PlayerHistory } from "./player/history.js";

function ContainerDefinition(type = "div", classes = [ ], id = null) {
    this.type    = type;
    this.classes = classes;
    this.id      = id;
}

function Container(data = { }, container = new ContainerDefinition) {
    this.data = data;
    this.root = document.createElement(container.type);
    container.classes.map(name => this.root.classList.add(name));
    if (container.id != null)
        this.root.id = container.id;
}

function Application(action, arg) {

    this.addContainer = (action, arg) => {
        let container;
        if (action == "importer" && arg != null) {
            container = new ImportDisplay(arg);
        } else if (action == "importer") {
            container = new DirectoryList();
        } else if (action == "recording" && arg != null) {
            container = new RecordingDisplay(arg);
        } else if (action == "recording") {
            container = new RecordingList();
        } else if (action == "ratings") {
            container = new RatingManager();
        } else if (action == "history") {
            container = new PlayerHistory();
        } else if (action == "playlist" && arg != null) {
            container = new PlaylistEditor(arg);
        } else if (action == "playlist") {
            container = new PlaylistList();
        } else if (action == "radio") {
            container = new RadioContainer();
        } else if (action == "log") {
            container = new LogManager();
        } else {
            container = new Player();
        }
        this.container = container.root;
        this.content.append(this.container);
    }

    this.content = document.getElementById("content");

    this.errorHandler = function(messages) {
        let container = new ErrorDisplay(messages);
        this.content.replaceChild(container.root, this.container);
    }

    Container.prototype.api = new Api(this.errorHandler.bind(this));

    Container.prototype.getNotificationService = function(path) {
        let wsUrl = "ws://" + location.host + path;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => { });
        return ws;
    }

    this.addContainer(action, arg);
    this.content.addEventListener("update-rating", ev => this.api.updateRating(ev.detail))
}

export { Container, ContainerDefinition };

window.onload = e => {
    let path = window.location.pathname.split("/");
    let action = (path.length > 1) ? path[1] : null
    let arg = (path.length > 2) ? path.slice(2, path.length).join("/") : null
    let app = new Application(action, arg);
}
