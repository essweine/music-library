import { Recording } from "/static/modules/api.js";

class RatingContainer extends HTMLSpanElement {
    constructor() {
        super()

        for (let i = 0; i < 5; i++) {
            let icon = this.createIcon("grade", "star-icon");
            icon.onclick = e => this.updateRating(i + 1);
            this.append(icon);
        }

        let clearIcon = this.createIcon("clear", "clear-icon");
        clearIcon.onclick = e => this.updateRating(null);
        this.append(clearIcon);
    }

    setRating(rating) {

        let newRating = null;
        if (typeof(rating) == "number")
            newRating = rating;
        else if (typeof(rating) == "string")
            newRating = parseInt(rating, null);
        else
            newRating = null;

        let stars = this.getElementsByClassName("star-icon");
        for (let i = 0; i < 5; i++) {
            if (newRating == null) {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.remove("unfilled");
            } else if (i < newRating) {
                stars.item(i).classList.add("filled");
                stars.item(i).classList.remove("unfilled");
            } else {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.add("unfilled");
            }
        }

        return newRating;
    }

    updateRating(rating) {
        let newRating = this.setRating(rating);
        let ev = new CustomEvent("rating-change", { detail: newRating, bubbles: true });
        this.dispatchEvent(ev);
    }

    sendRating(node, recordingId, item, rating) {
        (rating != null) ? node.setAttribute("rating", rating) : node.removeAttribute("rating");
        let recordingApi = new Recording(recordingId);
        let data = { item: item, rating: rating };
        recordingApi.updateRating(data);
    }

    createIcon(iconName, iconClass) {
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add(iconClass);
        return icon;
    }
}

export { RatingContainer };
