import { Container } from "../container.js";
import { Icon, RatingDisplay } from "../shared/widgets.js";

function TrackDisplay() {

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
TrackDisplay.prototype = Container;

function PreviewDisplay() {
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
PreviewDisplay.prototype = Container;

function StationDisplay() {

    Container.init.call(this, "div", "current-stream");

    let url = this.createElement("div", "station-data");
    this.root.append(url);

    let stationLink = this.createElement("a");

    let titleContainer = this.createElement("div", "stream-title-container");
    let streamTitle = this.createElement("div", "stream-title");
    titleContainer.append(streamTitle);

    this.root.append(titleContainer);

    this.update = (stream) => {
        if (stream.info.website) {
            url.innerText = "Streaming ";
            stationLink.href = stream.info.website;
            stationLink.innerText = stream.info.name;
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
StationDisplay.prototype = Container;

function PodcastDisplay() {

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
        description.innerHTML = podcast.description;
        ratingDisplay.setRating(this.createRating("podcast", podcast.podcast_id, podcast.rating));
    }
}
PodcastDisplay.prototype = Container;

export { TrackDisplay, PreviewDisplay, StationDisplay, PodcastDisplay };
