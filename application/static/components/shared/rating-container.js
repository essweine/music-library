import { createIcon } from "/static/components/shared/icons.js";

function createRatingContainer(className = null) {

    let container = document.createElement("span");
    container.classList.add("rating-container");
    if (className != null)
        container.classList.add(className);

    container.configure = (itemType, itemId, rating, label = null) => {
        container.itemType = itemType;
        container.itemId   = itemId;
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
        let detail = { 
            item_type: container.itemType,
            item_id: container.itemId, 
            value: rating
        }
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

function createRatingSelector() {

    let select = document.createElement("select");
    for (let rating of [ "1", "2", "3", "4", "5" ]) {
        let option = document.createElement("option");
        option.value = rating;
        option.innerText = rating;
        select.append(option)
    }
    return select;
}

export { createRatingContainer, createRatingSelector };
