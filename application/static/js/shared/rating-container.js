import { createIcon } from "./icons.js";

function createRatingContainer(rating, className = null, labelText = null) {

    let container = document.createElement("span");

    container.setRating = (rating) => {
        container.rating = rating;
        container.setValue(rating.value);
    }

    container.setValue = (value) => {
        container.rating.value = value;
        let stars = container.getElementsByClassName("star-icon");
        for (let i = 0; i < 5; i++) {
            if (value == null) {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.remove("unfilled");
            } else if (i < value) {
                stars.item(i).classList.add("filled");
                stars.item(i).classList.remove("unfilled");
            } else {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.add("unfilled");
            }
        }
    }

    container.updateValue = (value) => {
        container.setValue(value);
        container.dispatchEvent(new CustomEvent("update-rating", { detail: container.rating, bubbles: true }));
    }

    container.addIcon = (name, action, className) => {
        let icon = createIcon(name, action, className);
        container.append(icon);
    }

    container.classList.add("rating-container");
    if (className != null)
        container.classList.add(className);

    if (labelText != null) {
        let label = document.createElement("span");
        label.classList.add("rating-label");
        label.innerText = labelText;
        container.append(label);
    }

    for (let i = 0; i < 5; i++)
        container.addIcon("grade", e => container.updateValue(i + 1), "star-icon");
    container.addIcon("clear", e => container.updateValue(null), "clear-icon");

    if (rating != null)
        container.setRating(rating);

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
