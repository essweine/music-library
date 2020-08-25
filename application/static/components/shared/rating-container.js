import { createIcon } from "/static/components/shared/icons.js";

function createRatingContainer(className = null) {

    let container = document.createElement("span");
    container.classList.add("rating-container");
    if (className != null)
        container.classList.add(className);

    container.configure = (recordingId, ratedItem, rating, label = null) => {
        container.recordingId = recordingId;
        container.ratedItem = ratedItem;
        container.setRating(rating);
        if (label != null) {
            container.label = document.createElement("span");
            container.label.classList.add("rating-label");
            container.label.innerText = label; 
            container.prepend(container.label);
        }
    }

    container.setRating = (rating) => {
        container.rating = rating;
        let stars = container.getElementsByClassName("star-icon");
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

    container.updateRating = (rating) => {
        container.setRating(rating);
        let data = { item: container.ratedItem, rating: rating };
        let detail = { recordingId: container.recordingId, data: data };
        container.dispatchEvent(new CustomEvent("update-rating", { detail: detail, bubbles: true }));
    }

    container.addIcon = (name, action, className) => {
        let icon = createIcon(name, action, className);
        container.append(icon);
    }

    for (let i = 0; i < 5; i++)
        container.addIcon("grade", e => container.updateRating(i + 1), "star-icon");
    container.addIcon("clear", e => container.updateRating(null), "clear-icon");

    return container;
}

export { createRatingContainer };
