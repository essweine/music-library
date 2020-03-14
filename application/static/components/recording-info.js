import { createRatingContainer } from "/static/components/rating-container.js";

class RecordingInfo extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-info";

        this.titleDisplay    = document.createElement("span");
        this.artistDisplay   = document.createElement("span");
        this.dateDisplay     = document.createElement("span");
        this.venueDisplay    = document.createElement("span");
        this.recordingRating = createRatingContainer();
        this.soundRating     = createRatingContainer();

        this.recordingRating.setLabel("Rating");
        this.soundRating.setLabel("Sound Rating");

        this.displayElements = [
            this.titleDisplay,
            this.artistDisplay,
            this.dateDisplay,
            this.venueDisplay,
            this.recordingRating,
            this.soundRating
        ]

        for (let item of this.displayElements)
            item.classList.add("recording-display");

        this.titleLabel = this.createLabel("title", "Title");
        this.titleInput = this.createInput("title", 30);
        this.artistLabel = this.createLabel("artist", "Artist");
        this.artistInput = this.createInput("artist", 30);
        this.dateLabel = this.createLabel("recording-date", "Recording date");
        this.dateInput = this.createInput("recording-date", 30);
        this.venueLabel = this.createLabel("venue", "Venue");
        this.venueInput = this.createInput("venue", 30);

        this.editElements = [
            this.titleLabel,
            this.titleInput,
            this.artistLabel,
            this.artistInput,
            this.dateLabel,
            this.dateInput,
            this.venueLabel,
            this.venueInput
        ]
    }

    initialize(recordingId) {
        this.recordingRating.initialize(recordingId, "rating", this.getAttribute("rating"));
        this.soundRating.initialize(recordingId, "sound-rating", this.getAttribute("sound-rating"));
        this.reset();
    }

    update(context) {
        if (context == "display") {
            for (let elem of this.editElements)
                elem.remove();
            for (let elem of this.displayElements)
                this.append(elem);
        } else {
            for (let elem of this.displayElements)
                elem.remove();
            for (let elem of this.editElements)
                this.append(elem);
        }
        this.reset();
    }

    get(attribute) { return this.getAttribute(attribute); }

    set(title, artist, recordingDate, venue) {
        this.setAttribute("title", title);
        this.setAttribute("artist", artist);
        this.setAttribute("recording-date", recordingDate);
        this.setAttribute("venue", venue);
    }

    reset() {
        this.titleDisplay.innerText      = this.getAttribute("title");
        this.artistDisplay.innerText     = this.getAttribute("artist");
        this.dateDisplay.innerText       = this.getAttribute("recording-date");
        this.venueDisplay.innerText      = this.getAttribute("venue");

        this.titleInput.value  = this.getAttribute("title");
        this.artistInput.value = this.getAttribute("artist");
        this.dateInput.value   = this.getAttribute("recording-date");
        this.venueInput.value  = this.getAttribute("venue");
    }

    save() {
        this.setAttribute("title", this.titleInput.value);
        this.setAttribute("artist", this.artistInput.value);
        this.setAttribute("recording-date", this.dateInput.value);
        this.setAttribute("venue", this.venueInput.value);
    }

    createLabel(name, display) {
        let label       = document.createElement("label");
        label.htmlFor   = name;
        label.innerText = display;
        label.classList.add("recording-label");
        return label;
    }

    createInput(name, size) {
        let input  = document.createElement("input");
        input.type = "text";
        input.id   = name;
        input.size = size;
        input.classList.add("recording-input");
        return input;
    }
}

export { RecordingInfo };
