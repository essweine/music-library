import { Container, ContainerDefinition } from "../application.js";
import { Task, Rating } from "../api.js";
import { Icon, RatingDisplay } from "../shared/widgets.js";
import { CurrentPlaylist } from "./playlist.js";

function CurrentTrack() {

    let def = new ContainerDefinition("div", [ ], "current-track");
    Container.call(this, { }, def);

    let artworkContainer = document.createElement("div");
    artworkContainer.classList.add("bullshit-container-1");
    this.root.append(artworkContainer);

    let img = document.createElement("img");
    img.id = "artwork";
    img.width = 250;
    img.height = 250;
    artworkContainer.append(img);

    let textContainer = document.createElement("div");
    textContainer.classList.add("bullshit-container-2");
    this.root.append(textContainer);

    let trackTitle = document.createElement("div");
    trackTitle.id = "track-title";
    textContainer.append(trackTitle);

    let recordingTitle = document.createElement("div");
    recordingTitle.id = "recording-title";
    let recordingLink = document.createElement("a");
    recordingLink.id = "recording-link";
    recordingTitle.append(recordingLink);
    textContainer.append(recordingTitle);

    let artist = document.createElement("div");
    artist.id = "track-artist";
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
        ratingDisplay.setRating(new Rating("track", track.filename, track.rating));
    }
}
CurrentTrack.prototype = new Container;

function CurrentStream() {

    let def = new ContainerDefinition("div", [ ], "current-stream");
    Container.call(this, { }, def);

    let url = document.createElement("div");
    url.id = "station-data";
    this.root.append(url);

    let stationLink = document.createElement("a");

    let titleContainer = document.createElement("div");
    titleContainer.id = "stream-title-container";
    let streamTitle = document.createElement("div");
    streamTitle.id = "stream-title";
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
CurrentStream.prototype = new Container;

function PlayerControls() {

    let def = new ContainerDefinition("div", [ ], "player-controls");
    Container.call(this, { }, def);

    let classes = [ "control-icon" ];
    let skipPrev = new Task("skip", { offset: -1 });
    let skipNext = new Task("skip", { offset: 1 });

    let previous = new Icon("skip_previous", e => this.api.sendTasks([ skipPrev ]), classes);
    let stop     = new Icon("stop", e => this.api.stop(), classes);
    let pause    = new Icon("pause", e => this.api.pause(), classes);
    let play     = new Icon("play_arrow", e => this.api.start(), classes);
    let next     = new Icon("skip_next", e => this.api.sendTasks([ skipNext ]), classes);

    [ previous, stop, pause, play, next ].map(icon => this.root.append(icon.root));
}
PlayerControls.prototype = new Container;

function Player() {

    let def = new ContainerDefinition("div", [ ], "player-container");
    Container.call(this, { }, def);

    let currentTrack   = new CurrentTrack();
    let currentStream  = new CurrentStream();
    let playerControls = new PlayerControls();
    let playlist       = new CurrentPlaylist();

    for (let elem of [ currentTrack.root, playerControls.root, playlist.root ])
        this.root.append(elem);

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
    }

    let ws = this.getNotificationService(this.api.playerNotification);
    ws.addEventListener("message", e => this.api.getCurrentState(this.update));
    document.title = "Now Playing";
}
Player.prototype = new Container;

export { Player };
