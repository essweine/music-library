import { RatingContainer } from "/static/components/rating-container.js";

class RecordingInfo extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-info";
    }

    update(context) {
        while (this.firstChild)
            this.firstChild.remove();
        if (context == "display")
            this.updateForDisplay();
        else if (context == "import")
            this.updateForEdit(true);
        else
            this.updateForEdit();
    }

    updateForDisplay() {

        let title         = this.getAttribute("title");
        let artist        = this.getAttribute("artist");
        let recordingDate = this.getAttribute("recording-date");
        let venue         = this.getAttribute("venue");

        let titleDisplay        = document.createElement("span");
        titleDisplay.innerText  = title;

        let artistDisplay       = document.createElement("span");
        artistDisplay.innerText = artist;

        let dateDisplay         = document.createElement("span");
        dateDisplay.innerText   = recordingDate;

        let venueDisplay        = document.createElement("span");
        venueDisplay.innerText  = venue;

        let ratingDisplay       = document.createElement("span");
        ratingDisplay.innerText = "Rating";

        let soundDisplay        = document.createElement("span");
        soundDisplay.innerText  = "Sound Rating";

        for (let item of [ titleDisplay, artistDisplay, dateDisplay, venueDisplay, ratingDisplay, soundDisplay ])
            item.classList.add("recording-display");

        this.append(titleDisplay);
        this.append(artistDisplay);
        this.append(dateDisplay);
        this.append(venueDisplay);
        this.append(ratingDisplay);
        this.append(this.createRatingContainer("rating"));
        this.append(soundDisplay);
        this.append(this.createRatingContainer("sound-rating"));
    }

    updateForEdit(updateAttributes = false) {

        let title         = this.getAttribute("title");
        let artist        = this.getAttribute("artist");
        let recordingDate = this.getAttribute("recording-date");
        let venue         = this.getAttribute("venue");

        this.append(this.createLabel("title", "Title"));
        this.append(this.createInput("title", title, 30, updateAttributes));
        this.append(this.createLabel("artist", "Artist"));
        this.append(this.createInput("artist", artist, 30, updateAttributes));
        this.append(this.createLabel("recording-date", "Recording date"));
        this.append(this.createInput("recording-date", recordingDate, 30, updateAttributes));
        this.append(this.createLabel("venue", "Venue"));
        this.append(this.createInput("venue", venue, 30, updateAttributes));
    }

    set(title, artist, recordingDate, venue) {
        this.setAttribute("title", title);
        this.setAttribute("artist", artist);
        this.setAttribute("recording-date", recordingDate);
        this.setAttribute("venue", venue);
        this.update("import");
    }

    save() {
        this.setAttribute("title", this.querySelector("[id='title']").value);
        this.setAttribute("artist", this.querySelector("[id='artist']").value);
        this.setAttribute("recording-date", this.querySelector("[id='recording-date']").value);
        this.setAttribute("venue", this.querySelector("[id='venue']").value);
    }

    get(attribute) { 
        if ([ "rating", "sound-rating" ].includes(attribute) && this.getAttribute(attribute) != null)
            return parseInt(this.getAttribute(attribute));
        else
            return this.getAttribute(attribute); 
    }

    createLabel(name, display) {
        let label       = document.createElement("label");
        label.htmlFor   = name;
        label.innerText = display;
        label.classList.add("recording-label");
        return label;
    }

    createInput(name, value, size, updateAttributes = false) {
        let input = document.createElement("input");
        input.type = "text";
        input.id = name;
        input.value = value;
        input.size = size;
        if (updateAttributes)
            input.oninput = e => e.target.parentNode.setAttribute(name, e.target.value);
        input.classList.add("recording-input");
        return input;
    }

    createRatingContainer(attribute) {
        let ratingContainer = document.createElement("span", { is: "rating-container" });
        ratingContainer.classList.add("recording-rating");
        ratingContainer.setRating(this.getAttribute(attribute));
        ratingContainer.addEventListener("rating-change", e => {
            (e.detail != null) ? this.setAttribute(attribute, e.detail) : this.removeAttribute(attribute);
            let detail = { item: attribute, rating: e.detail };
            let ev = new CustomEvent("update-rating", { detail: detail, bubbles: true });
            this.dispatchEvent(ev);
        });
        return ratingContainer;
    }
}

export { RecordingInfo }
