import { Container } from "./container.js";
import { NowPlaying } from "./player/now-playing.js";
import { PlayerHistory } from "./player/history.js";
import { DirectoryList } from "./library/directory.js";
import { RecordingBrowser } from "./library/recording-list.js";
import { RecordingDisplay, ImportDisplay } from "./library/recording.js";
import { PlaylistList, PlaylistEditor } from "./library/playlist.js";
import { StationContainer } from "./library/station.js";
import { PodcastContainer } from "./library/podcast.js";
import { RatingManager } from "./library/rating-manager.js";
import { SuggestionManager } from "./library/suggestions.js";
import { LogManager } from "./log-manager.js";

function ErrorDisplay(messages) {

    Container.init.call(this, "div",  "error-display");

    let heading = this.createElement("div", null, [ "error-heading" ]);
    heading.innerText = "The following errors occurred";
    this.root.append(heading);

    for (let message of messages) {
        let msg = this.createElement("div", null, [ "error-message" ]);
        msg.innerText = message;
        this.root.append(msg);
    }

    document.title = "An error occurred";
}
ErrorDisplay.prototype = Container;

function Application(action, arg, content) {

    Container.errorHandler = function(messages) {
        let container = new ErrorDisplay(messages);
        while (content.firstChild)
            content.firstChild.remove();
        content.append(container.root);
    };

    let container;
    if (action == "importer" && arg != null) {
        container = new ImportDisplay(arg);
    } else if (action == "importer") {
        container = new DirectoryList();
    } else if (action == "recording" && arg != null) {
        container = new RecordingDisplay(arg);
    } else if (action == "recording") {
        container = new RecordingBrowser();
    } else if (action == "suggestions") {
        container = new SuggestionManager();
    } else if (action == "ratings") {
        container = new RatingManager();
    } else if (action == "history") {
        container = new PlayerHistory();
    } else if (action == "playlist" && arg != null) {
        container = new PlaylistEditor(arg);
    } else if (action == "playlist") {
        container = new PlaylistList();
    } else if (action == "radio") {
        container = new StationContainer();
    } else if (action == "podcast") {
        container = new PodcastContainer();
    } else if (action == "log") {
        container = new LogManager();
    } else {
        container = new NowPlaying();
    }
    content.append(container.root);

}

window.onload = e => {
    let path    = window.location.pathname.split("/");
    let action  = (path.length > 1) ? path[1] : null
    let arg     = (path.length > 2) ? path.slice(2, path.length).join("/") : null
    let content = document.getElementById("content");
    new Application(action, arg, content);
}

