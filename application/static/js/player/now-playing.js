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

function PreviewTrack() {
    Container.init.call(this, "div", "current-track");

    let filename = this.createElement("div", "track-title");
    this.root.append(filename);

    let dirname = this.createElement("div", "recording-title");
    dirname.innerText = "Previewing";
    let addDir = this.createElement("a", "recording-link");
    dirname.append(addDir);
    this.root.append(dirname);

    this.update = (track, directory) => {
        filename.innerText = track.filename;
        addDir.href = "/importer/" + encodeURIComponent(directory);
        addDir.innerText = directory;
    }
}
PreviewTrack.prototype = Container;

function CurrentStation() {

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
CurrentStation.prototype = Container;

function CurrentPodcast() {

    Container.init.call(this, "div", "current-stream");

    let podcastTitle = this.createElement("div", "podcast-title");
    this.root.append(podcastTitle);

    let podcastName = this.createElement("div", "podcast-name");
    let podcastLink = this.createElement("a", "podcast-link");
    podcastName.append(podcastLink);
    this.root.append(podcastName);

    let pubDate = this.createElement("div", "podcast-published");
    this.root.append(pubDate);

    let ratingDisplay = new RatingDisplay(null, [ ], null, "podcast-rating");
    this.root.append(ratingDisplay.root);

    let description = this.createElement("div", "podcast-description");
    this.root.append(description);

    this.update = (podcast) => {
        podcastTitle.innerText = podcast.episode_title;
        podcastLink.href = podcast.website;
        podcastLink.innerText = podcast.podcast_name;
        pubDate.innerText = "Published " + podcast.date_published;
        description.innerText = podcast.description;
        ratingDisplay.setRating(this.createRating("podcast", podcast.podcast_id, podcast.rating));
    }
}
CurrentPodcast.prototype = Container;

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
    let previewTrack   = new PreviewTrack();
    let currentStation = new CurrentStation();
    let currentPodcast = new CurrentPodcast();
    let playerControls = new PlayerControls();
    let playlist       = new CurrentPlaylist();

    for (let elem of [ currentTrack, playerControls, playlist ])
        this.root.append(elem.root);

    this.update = (state) => {
        if (state.stream != null && state.stream.station != null) {
            currentStation.update(state.stream);
            currentTrack.root.remove();
            playlist.root.remove();
            this.root.insertBefore(currentStation.root, playerControls.root);
        } else if (state.stream != null && state.stream.podcast != null) {
            currentPodcast.update(state.stream.podcast);
            currentTrack.root.remove();
            currentStation.root.remove();
            playlist.root.remove();
            this.root.insertBefore(currentPodcast.root, playerControls.root);
        } else if (state.playlist.length > 0) {
            let current = state.playlist[state.current];
            if (state.preview == null) {
                previewTrack.root.remove();
                currentTrack.update(current);
                this.root.insertBefore(currentTrack.root, playerControls.root);
            } else {
                currentTrack.root.remove();
                previewTrack.update(current, state.preview);
                this.root.insertBefore(previewTrack.root, playerControls.root);
            }
            currentStation.root.remove();
            currentPodcast.root.remove();
            this.root.append(playlist.root);
            if (state.preview != null)
                playlist.updateView(true);
        } else {
            currentTrack.root.remove();
            previewTrack.root.remove();
            currentStation.root.remove();
            currentPodcast.root.remove();
            this.root.append(playlist.root);
        }
        playlist.update(state);
        if (state.proc_state == "playing" && state.stream == null) {
            let current = state.playlist[state.current];
            document.title = "Now Playing: " + current.title + " (" + current.artist + ")";
        } else if (state.proc_state == "playing" && state.stream != null) {
            let streamTitle = (state.stream.station != null) ? state.stream.station.name : state.stream.podcast.podcast_name;
            document.title = "Now Playing: " + streamTitle;
        } else { document.title = "Now Playing [" + state.proc_state + "]"; }
    }

    let ws = this.getNotificationService(this.playerNotification);
    ws.addEventListener("message", e => this.getCurrentState(this.update));
    document.title = "Now Playing";
}
NowPlaying.prototype = Container;

export { NowPlaying };
