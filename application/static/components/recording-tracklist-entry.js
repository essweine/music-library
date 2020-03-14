import { createRatingContainer } from "/static/components/rating-container.js";

class RecordingTrack extends HTMLDivElement {

    constructor() {
        super();

        this.classList.add("recording-track");
        this.filename    = this.getAttribute("filename"); 
        this.recordingId = this.getAttribute("recording-id");

        // Always present
        this.trackNum = document.createElement("span");
        this.trackNum.classList.add("recording-tracklist-position");
        this.append(this.trackNum);

        // Display Elements
        this.trackTitle = document.createElement("span");
        this.trackTitle.classList.add("recording-tracklist-display");

        this.ratingContainer = createRatingContainer();
        this.ratingContainer.initialize(this.recordingId, this.getAttribute("filename"), this.getAttribute("rating"));
        this.ratingContainer.classList.add("recording-tracklist-rating");
        this.removeAttribute("rating");

        // Edit elements
        this.label = document.createElement("label");
        this.label.classList.add("recording-tracklist-label");
        this.label.innerText = this.filename;
        this.label.htmlFor = this.filename;

        this.input = document.createElement("input");
        this.input.id = this.filename;
        this.input.type = "text";
        this.input.size  = 40;
        this.input.classList.add("recording-tracklist-input");

        this.moveUp = document.createElement("span", { is: "up-arrow" });
        this.moveUp.classList.add("move-up");

        this.moveDown = document.createElement("span", { is: "down-arrow" });
        this.moveDown.classList.add("move-down");

        this.addEventListener("move", e => {
            let position = parseInt(this.getAttribute("position"));
            let detail = (e.detail == "up") ? position : position + 1;
            let ev = new CustomEvent("move-track", { detail: detail, bubbles: true });
            this.dispatchEvent(ev);
        });

        this.addEventListener("remove", e => {
            let position = parseInt(this.getAttribute("position"));
            let ev = new CustomEvent("remove-track", { detail: position, bubbles: true });
            this.dispatchEvent(ev);
        });
    }

    initialize() { }

    update(context) {
        if (context == "display") {
            this.label.remove();
            this.input.remove();
            this.moveUp.remove();
            this.moveDown.remove();
            this.append(this.trackTitle);
            this.append(this.ratingContainer);
        } else {
            this.trackTitle.remove();
            this.ratingContainer.remove();
            this.append(this.label);
            this.append(this.input);
            this.append(this.moveUp);
            this.append(this.moveDown);
        }
        this.reset();
    }

    updatePosition (position, firstTrack, lastTrack) {
        this.setAttribute("position", position);
        this.updateTrackNum();
        if (firstTrack) {
            this.querySelector("[class~='move-up']").style.display = "none";
            this.querySelector("[class~='move-down']").style.display = "inline";
        } else if (lastTrack) {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "none";
        } else {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "inline";
        }
    }

    getName() { return this.input.value; }

    setName(name) { this.input.value = name; }

    updateTrackNum() { this.trackNum.innerText = parseInt(this.getAttribute("position")) + 1; }

    save() { this.setAttribute("title", this.input.value); }

    reset() {
        this.trackNum.innerText   = parseInt(this.getAttribute("position")) + 1;
        this.trackTitle.innerText = this.getAttribute("title");
        this.input.value          = this.getAttribute("title");
    }

    asObject() {
        let data = { };
        for (let attr of this.getAttributeNames())
            if (! [ "is", "id", "class"].includes(attr))
                data[attr.replace("-", "_")] = this.getAttribute(attr);
        data.track_num = parseInt(data.position) + 1;
        delete data.position;
        return data;
    }
}

export { RecordingTrack };
