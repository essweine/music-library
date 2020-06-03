import { Recording } from "/static/modules/api.js";

class RatingContainer extends HTMLSpanElement {
    constructor() {
        super();

        for (let i = 0; i < 5; i++) {
            let icon = this.createIcon("grade", "star-icon");
            icon.onclick = e => this.updateRating(i + 1);
            this.append(icon);
        }

        let clearIcon = this.createIcon("clear", "clear-icon");
        clearIcon.onclick = e => this.updateRating(null);
        this.append(clearIcon);
    }

    setLabel(text) { 
        this.label = document.createElement("span");
        this.label.classList.add("rating-label");
        this.label.innerText = text; 
        this.prepend(this.label);
    }

    initialize(recordingId, ratedItem, rating) {
        this.recordingId = recordingId;
        this.ratedItem = ratedItem;
        this.setRating(rating);
    }

    setRating(rating) {
        this.rating = rating;
        let stars = this.getElementsByClassName("star-icon");
        for (let i = 0; i < 5; i++) {
            if (rating == null) {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.remove("unfilled");
            } else if (i < rating) {
                stars.item(i).classList.add("filled");
                stars.item(i).classList.remove("unfilled");
            } else {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.add("unfilled");
            }
        }
    }

    updateRating(rating) {
        this.setRating(rating);
        let recordingApi = new Recording();
        let data = { item: this.ratedItem, rating: rating };
        recordingApi.updateRating(this.recordingId, data);
    }

    createIcon(iconName, iconClass) {
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add(iconClass);
        return icon;
    }
}

function createRatingContainer() {
    let ratingContainer = document.createElement("span", { is: "rating-container" });
    ratingContainer.classList.add("recording-rating");
    return ratingContainer;
}

export { RatingContainer, createRatingContainer };
