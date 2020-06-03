import { createRatingContainer } from "/static/components/rating-container.js";

class CurrentTrack extends HTMLDivElement {

    constructor() {
        super();
        this.id = "current-track";

        this.bullshitArtworkContainer = document.createElement("div");
        this.bullshitArtworkContainer.classList.add("bullshit-container-1");
        this.append(this.bullshitArtworkContainer);

        this.bullshitTextContainer = document.createElement("div");
        this.bullshitTextContainer.classList.add("bullshit-container-2");
        this.append(this.bullshitTextContainer);

        this.img = document.createElement("img");
        this.img.id = "artwork";
        // Ideally I would not have to set this, but none of the css-based solutions I've tried
        // have worked.  When I get around to making this truly responsive (if I ever do given what a 
        // fucking gigantic pile of shit css is) I suppose I'll revisit it.  Who would have thought 
        // making a resizable square container would be so fucking difficult?
        this.img.width = 250;
        this.img.height = 250;
        this.bullshitArtworkContainer.append(this.img);

        this.trackTitle = document.createElement("div");
        this.trackTitle.id = "track-title";
        this.bullshitTextContainer.append(this.trackTitle);

        this.recordingTitle = document.createElement("div");
        this.recordingTitle.id = "recording-title";
        this.recordingLink = document.createElement("a");
        this.recordingLink.id = "recording-link";
        this.recordingTitle.append(this.recordingLink);
        this.bullshitTextContainer.append(this.recordingTitle);

        this.artist = document.createElement("div");
        this.artist.id = "track-artist";
        this.bullshitTextContainer.append(this.artist);

        this.ratingContainer = createRatingContainer();
        this.ratingContainer.id = "track-rating";

        this.bullshitTextContainer.append(this.ratingContainer);
    }

    update(track) {

        this.trackTitle.innerText = track.title;
        this.recordingLink.href = "/recording/" + track.recording_id;
        this.recordingLink.innerText = track.recording;
        this.artist.innerText = track.artist;
        if (track.artwork != null)
            this.img.src = "/file/" + track.artwork;
        else
            this.img.remove();
        this.ratingContainer.initialize(track.recording_id, track.filename, track.rating);
    }
}

export { CurrentTrack };
