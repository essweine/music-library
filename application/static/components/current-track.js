import { createRatingContainer } from "/static/components/rating-container.js";

class CurrentTrack extends HTMLDivElement {

    constructor() {
        super();
        this.id = "current-track";
        this.bullshitArtworkContainer = document.getElementById("bullshit-container-1");
        this.bullshitTextContainer = document.getElementById("bullshit-container-2");

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
        this.artist.id = "artist";
        this.bullshitTextContainer.append(this.artist);

        this.ratingContainer = createRatingContainer();
        this.ratingContainer.id = "track-rating";

        this.bullshitTextContainer.append(this.ratingContainer);
    }

    update() {

        this.trackTitle.innerText = this.getAttribute("track-title");
        this.recordingLink.href = "/recording/" + this.getAttribute("recording-id");
        this.recordingLink.innerText = this.getAttribute("recording-title")
        this.artist.innerText = this.getAttribute("artist");
        if (this.getAttribute("artwork") != null)
            this.img.src = "/file/" + this.getAttribute("artwork");
        else
            this.img.remove();
        this.ratingContainer.initialize(this.getAttribute("recording-id"), this.getAttribute("filename"), this.getAttribute("rating"));
    }
}

export { CurrentTrack };
