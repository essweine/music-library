import { Container } from "../container.js";
import { Icon, RatingDisplay } from "../shared/widgets.js";
import { CurrentPlaylist } from "./playlist.js";

function CurrentTrack() {

    Container.init.call(this, "div", "current-track");

    let artworkContainer = this.createElement("div", "bullshit-container-1");
    this.root.append(artworkContainer);

    let img = this.createElement("img", "artwork");
    img.width = 250;
    img.height = 250;
    artworkContainer.append(img);

    let textContainer = this.createElement("div", "bullshit-container-2");
    this.root.append(textContainer);

    let trackTitle = this.createElement("div", "track-title");
    textContainer.append(trackTitle);

    let recordingTitle = this.createElement("div", "recording-title");
    let recordingLink = this.createElement("a", "recording-link");
    recordingTitle.append(recordingLink);
    textContainer.append(recordingTitle);

    let artist = this.createElement("div", "track-artist");
    textContainer.append(artist);

    let ratingDisplay = new RatingDisplay(null, [ ], null, "track-rating");
    textContainer.append(ratingDisplay.root);

    this.update = (track) => {
        trackTitle.innerText = track.title;
        recordingLink.href = "/recording/" + track.recording_id;
        recordingLink.innerText = track.recording;
        artist.innerText = track.artist;
        if (track.artwork != null)
            img.src = "/file/" + encodeURIComponent(track.artwork);
        else
            img.remove();
        ratingDisplay.setRating(this.createRating("track", track.filename, track.rating));
    }
}
CurrentTrack.prototype = Container;

function CurrentStream() {

    Container.init.call(this, "div", "current-stream");

    let url = this.createElement("div", "station-data");
    this.root.append(url);

    let stationLink = this.createElement("a");

    let titleContainer = this.createElement("div", "stream-title-container");
    let streamTitle = this.createElement("div", "stream-title");
    titleContainer.append(streamTitle);

    this.root.append(titleContainer);

    this.update = (stream) => {
        if (stream.station.website) {
            url.innerText = "Streaming ";
            stationLink.href = stream.station.website;
            stationLink.innerText = stream.station.name;
            url.append(stationLink);
        } else {
            stationLink.remove();
            url.innerText = "Streaming " + stream.station.name;
        }

        if (stream.metadata != null) 
            streamTitle.innerText = stream.metadata.StreamTitle;
        else
            streamTitle.innerText = "No metadata available";
    }
}
CurrentStream.prototype = Container;

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

    let currentTrack   = new CurrentTrack();
    let currentStream  = new CurrentStream();
    let playerControls = new PlayerControls();
    let playlist       = new CurrentPlaylist();

    for (let elem of [ currentTrack, playerControls, playlist ])
        this.root.append(elem.root);

    this.update = (state) => {
        if (state.stream != null) {
            currentStream.update(state.stream);
            currentTrack.root.remove();
            playlist.root.remove();
            this.root.insertBefore(currentStream.root, playerControls.root);
        } else if (state.playlist.length > 0) {
            let current = state.playlist[state.current];
            currentTrack.update(current);
            currentStream.root.remove();
            this.root.insertBefore(currentTrack.root, playerControls.root);
            this.root.append(playlist.root);
        } else {
            currentTrack.root.remove();
            currentStream.root.remove();
            this.root.append(playlist.root);
        }
        playlist.update(state);
        if (state.proc_state == "playing") {
            let current = state.playlist[state.current];
            document.title = "Now Playing: " + current.title + " (" + current.artist + ")";
        } else { document.title = "Now Playing [" + state.proc_state + "]"; }
    }

    let ws = this.getNotificationService(this.playerNotification);
    ws.addEventListener("message", e => this.getCurrentState(this.update));
    document.title = "Now Playing";
}
NowPlaying.prototype = Container;

export { NowPlaying };
