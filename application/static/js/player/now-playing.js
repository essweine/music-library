import { Container } from "../container.js";
import { Icon } from "../shared/widgets.js";
import { CurrentPlaylist } from "./playlist.js";
import { TrackDisplay, PreviewDisplay, StationDisplay, PodcastDisplay } from "./current-display.js";

function PlayerControls() {

    Container.init.call(this, "div", "player-controls");

    let classes = [ "control-icon" ];
    let skipPrev = this.createTask("skip", { offset: -1 });
    let skipNext = this.createTask("skip", { offset: 1 });

    let previous = new Icon("skip_previous", e => this.sendTasks([ skipPrev ]), classes);
    let stop     = new Icon("stop", e => this.stop(), classes);
    let pause    = new Icon("pause", e => this.pause(), classes);
    let play     = new Icon("play_arrow", e => this.start(), classes);
    let next     = new Icon("skip_next", e => this.sendTasks([ skipNext ]), classes);

    [ previous, stop, pause, play, next ].map(icon => this.root.append(icon.root));
}
PlayerControls.prototype = Container;

function NowPlaying() {

    Container.init.call(this, "div", "player-container");

    let trackDisplay   = new TrackDisplay();
    let previewDisplay = new PreviewDisplay();
    let stationDisplay = new StationDisplay();
    let podcastDisplay = new PodcastDisplay();
    let playerControls = new PlayerControls();
    let playlist       = new CurrentPlaylist();

    let displays = [ trackDisplay, previewDisplay, stationDisplay, podcastDisplay ];
    this.root.append(playerControls.root);

    let setPlaylistEntry = (entry_type, playlist) => {
        let entry = playlist.entries[playlist.position];
        if (entry_type == "track") {
            trackDisplay.update(entry.info);
            this.root.insertBefore(trackDisplay.root, playerControls.root);
        } else if (entry_type == "preview") {
            previewDisplay.update(entry.info, playlist.preview);
            this.root.insertBefore(previewDisplay.root, playerControls.root);
        }
    }

    let setDisplay = (state) => {
        if (state.current.entry_type == "track" || state.current.entry_type == "preview") {
            setPlaylistEntry(state.current.entry_type, state.playlist);
        } else if (state.current.entry_type == "podcast") {
            podcastDisplay.update(state.stream.info);
            this.root.insertBefore(podcastDisplay.root, playerControls.root);
        } else if (state.current.entry_type == "station") {
            stationDisplay.update(state.stream);
            this.root.insertBefore(stationDisplay.root, playerControls.root);
        }
    }

    this.update = (state) => {

        for (let item of displays)
            item.root.remove();
        playlist.root.remove();

        if (state.current != null)
            setDisplay(state)

        if (state.playlist.entries.length > 0) {
            let entry_type = (state.playlist.preview == null) ? "track" : "preview";
            setPlaylistEntry(entry_type, state.playlist);
            playlist.update(state.playlist);
            if (entry_type == "preview")
                playlist.updateView(true);
            this.root.append(playlist.root);
        }

        let displayTitle = (state.proc_state == "playing") ? ": " + state.current.title : " [" + state.proc_state + "]";
        document.title = "Now Playing" + displayTitle;
    }

    let ws = this.getNotificationService(this.playerNotification);
    ws.addEventListener("message", e => this.getCurrentState(this.update));
    document.title = "Now Playing";
}
NowPlaying.prototype = Container;

export { NowPlaying };
