import { addIcon } from "/static/modules/util.js";

class RatingContainer extends HTMLSpanElement {
    constructor() {
        super();
        for (let i = 0; i < 5; i++)
            this.addIcon("grade", e => this.updateRating(i + 1), "star-icon");
        this.addIcon("clear", e => this.updateRating(null), "clear-icon");
    }

    initialize(recordingId, ratedItem, rating, label = null) {
        this.recordingId = recordingId;
        this.ratedItem = ratedItem;
        this.setRating(rating);
        if (label != null) {
            this.label = document.createElement("span");
            this.label.classList.add("rating-label");
            this.label.innerText = label; 
            this.prepend(this.label);
        }
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
        let data = { item: this.ratedItem, rating: rating };
        let detail = { recordingId: this.recordingId, data: data };
        this.dispatchEvent(new CustomEvent("update-rating", { detail: detail, bubbles: true }));
    }

    addIcon = addIcon.bind(this);
}

function createRatingContainer() {
    let ratingContainer = document.createElement("span", { is: "rating-container" });
    ratingContainer.classList.add("recording-rating");
    return ratingContainer;
}

function addRatingContainer(recordingId, ratedItem, rating, classNames) {
    let ratingContainer = createRatingContainer();
    ratingContainer.initialize(recordingId, ratedItem, rating);
    for (let name of classNames)
        ratingContainer.classList.add(name);
    this.append(ratingContainer);
}

export { RatingContainer, createRatingContainer, addRatingContainer };
