import { Container } from "../container.js";
import { Icon } from "../shared/widgets.js";
import { CurrentPlaylist } from "./playlist.js";
import { TrackDisplay, PreviewDisplay, StationDisplay, PodcastDisplay } from "./current-display.js";

function AudioBar() {

    Container.init.call(this, "div", "audio-bar");
    this.data = {
        updateInterval: 500,
        duration: 0,
        elapsed: 0,
    };

    let bar = this.createElement("div", "audio-bar-background");
    let position = this.createElement("div", "audio-current-position");
    bar.append(position);
    this.root.append(bar);

    let audioTime = this.createElement("div", "audio-duration");
    this.root.append(audioTime);

    let formatTime = (duration) => {
        let totalSeconds = duration / 1000.0;
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor(totalSeconds / 60) - (hours * 60);
        let seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600));
        let include = (hours == 0) ? [ minutes, seconds ] : [ hours, minutes, seconds ];
        return include.map(val => (val < 10) ? "0" + val : val).join(":");
    }

    let getPosition = (e) => {
        let clickPosition = e.offsetX / bar.clientWidth;
        return this.data.duration * clickPosition;
    }
    bar.onclick = e => this.seek(getPosition(e));

    let elapsedTime = this.createElement("div", "audio-elapsed");
    bar.append(elapsedTime);
    let updateTime = (e) => {
        elapsedTime.innerText = formatTime(getPosition(e));
        elapsedTime.style.left = (e.clientX + 10) + "px";
        elapsedTime.style.top = (e.clientY + 10) + "px";
    }
    bar.onmouseover = e => { updateTime(e); elapsedTime.style.display = "block"; };
    bar.onmouseout = e => elapsedTime.style.display = "none";
    bar.onmousemove = updateTime;

    let setPosition = () => position.style.width = 100 * this.data.elapsed / this.data.duration + "%";

    this.update = () => {
        this.data.elapsed += this.data.updateInterval;
        setPosition();
    }

    this.configure = (duration, elapsed) => {
        this.data.duration = duration;
        this.data.elapsed = elapsed;
        audioTime.innerText = formatTime(duration);
        setPosition();
    }
}
AudioBar.prototype = Container;

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
    this.data = { timer: null };

    let trackDisplay   = new TrackDisplay();
    let previewDisplay = new PreviewDisplay();
    let stationDisplay = new StationDisplay();
    let podcastDisplay = new PodcastDisplay();
    let audioBar       = new AudioBar();
    let playerControls = new PlayerControls();
    let playlist       = new CurrentPlaylist();

    let displays = [ trackDisplay, previewDisplay, stationDisplay, podcastDisplay ];
    this.root.append(playerControls.root);

    let setPlaylistEntry = (entry_type, playlist, elapsed) => {
        let entry = playlist.entries[playlist.position];
        if (entry_type == "track") {
            trackDisplay.update(entry.info);
            this.root.insertBefore(trackDisplay.root, playerControls.root);
        } else if (entry_type == "preview") {
            previewDisplay.update(entry.info, playlist.preview);
            this.root.insertBefore(previewDisplay.root, playerControls.root);
        }
        audioBar.configure(entry.duration, elapsed);
        this.root.insertBefore(audioBar.root, playerControls.root);
    }

    let configurePlaylist = (state) => {
        let entry_type = (state.playlist.preview == null) ? "track" : "preview";
        if (state.current == null)
            setPlaylistEntry(entry_type, state.playlist, 0);
        playlist.update(state.playlist);
        if (entry_type == "preview")
            playlist.updateView(true);
        this.root.append(playlist.root);
    }

    let setDisplay = (state) => {
        if (state.current.entry_type == "track" || state.current.entry_type == "preview") {
            setPlaylistEntry(state.current.entry_type, state.playlist, state.current.elapsed);
            configurePlaylist(state);
        } else if (state.current.entry_type == "podcast") {
            podcastDisplay.update(state.podcast.info);
            this.root.insertBefore(podcastDisplay.root, playerControls.root);
            audioBar.configure(state.current.duration, state.current.elapsed);
            this.root.insertBefore(audioBar.root, playerControls.root);
        } else if (state.current.entry_type == "station") {
            stationDisplay.update(state.stream);
            this.root.insertBefore(stationDisplay.root, playerControls.root);
        }
    }

    this.update = (state) => {

        for (let item of displays)
            item.root.remove();
        audioBar.root.remove();
        playlist.root.remove();

        if (state.current != null)
            setDisplay(state)
        else if (state.playlist.entries.length > 0)
            configurePlaylist(state);

        if (this.data.timer != null)
            window.clearInterval(this.data.timer);
        if (state.proc_state == "playing")
            this.data.timer = window.setInterval(audioBar.update, audioBar.data.updateInterval);

        let displayTitle = (state.proc_state == "playing") ? ": " + state.current.title : " [" + state.proc_state + "]";
        document.title = "Now Playing" + displayTitle;
    }

    let ws = this.getNotificationService(this.playerNotification);
    ws.addEventListener("message", e => this.getCurrentState(this.update));
    document.title = "Now Playing";
}
NowPlaying.prototype = Container;

export { NowPlaying };
