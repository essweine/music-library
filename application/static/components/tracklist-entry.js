import { RatingContainer } from "/static/components/rating-container.js";

customElements.define("rating-container", RatingContainer, { extends: "span" });

class TracklistEntry extends HTMLDivElement {

    constructor() {
        super();
        this.classList.add("tracklist-entry");
        this.filename = this.getAttribute("filename");
    }

    update(context) {
        while (this.firstChild)
            this.firstChild.remove();
        if (context == "display")
            this.createDisplayEntry();
        else
            this.createEditEntry();
    }

    createDisplayEntry() {

        this.append(this.createPositionMarker());

        let title = document.createElement("span");
        title.innerText = this.getAttribute("title");
        title.classList.add("tracklist-display");
        this.append(title);

        this.append(this.createRatingContainer());
    }

    createEditEntry() {

        this.append(this.createPositionMarker());

        let title = this.getAttribute("title");

        let label       = document.createElement("label");
        label.htmlFor   = this.filename;
        label.innerText = this.filename;
        label.classList.add("tracklist-label");
        this.append(label);

        let input   = document.createElement("input");
        input.type  = "text";
        input.id    = this.filename;
        input.value = title;
        input.size  = 40;
        input.classList.add("tracklist-input");
        input.oninput = e => e.target.parentNode.setAttribute("title", e.target.value);
        this.append(input);

        let moveUp = this.createIcon("arrow_upward", "move-up");
        moveUp.onclick = e => this.createMoveEvent("up");
        this.append(moveUp);

        let moveDown = this.createIcon("arrow_downward", "move-down");
        moveDown.onclick = e => this.createMoveEvent("down");
        this.append(moveDown);
    }

    createMoveEvent(direction) {
        let trackNum = parseInt(this.getAttribute("track-num"));
        let detail = (direction == "up") ? trackNum : trackNum + 1;
        let ev = new CustomEvent("move-track", { detail: detail, bubbles: true });
        this.dispatchEvent(ev);
    }

    createPositionMarker() {
        let positionMarker = document.createElement("span");
        positionMarker.innerText = this.getAttribute("track-num");
        positionMarker.classList.add("tracklist-position");
        return positionMarker;
    }

    createRatingContainer() {
        let ratingContainer = document.createElement("span", { is: "rating-container" });
        ratingContainer.classList.add("tracklist-rating");
        ratingContainer.setRating(this.getAttribute("rating"));
        ratingContainer.addEventListener("rating-change", 
            e => (e.detail != null) ? this.setAttribute("rating", e.detail) : this.removeAttribute("rating"));
        return ratingContainer;
    }

    createIcon(iconName, iconClass) {
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add(iconClass);
        return icon;
    }

    updateTrackNum(trackNum, atEnd = false) {
        this.querySelector("[class='tracklist-position']").innerText = trackNum;
        this.setAttribute("track-num", trackNum);
        if (trackNum == 1) {
            this.querySelector("[class~='move-up']").style.display = "none";
            this.querySelector("[class~='move-down']").style.display = "inline";
        } else if (atEnd) {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "none";
        } else {
            this.querySelector("[class~='move-up']").style.display = "inline";
            this.querySelector("[class~='move-down']").style.display = "inline";
        }
    }

    asObject() {
        let data = { };
        for (let attr of this.getAttributeNames())
            if (! [ "is", "id", "class"].includes(attr))
                data[attr.replace("-", "_")] = this.getAttribute(attr);
        return data;
    }
}

export { TracklistEntry };
