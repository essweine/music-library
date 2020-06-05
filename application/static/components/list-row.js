import { createRatingContainer } from "/static/components/rating-container.js";

class ListRow extends HTMLDivElement {
    constructor() {
        super();
    }

    addText(text, className) {
        let cell = document.createElement("span");
        cell.innerText = text;
        cell.classList.add("list-cell");
        cell.classList.add(className);
        this.append(cell);
    }

    addIcon(iconName, action, className) {
        let icon = document.createElement("span");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add(className);
        icon.onclick = action;
        this.append(icon);
    }

    addRatingContainer(recordingId, ratedItem, rating, className) {
        let ratingContainer = createRatingContainer();
        ratingContainer.initialize(recordingId, ratedItem, rating);
        ratingContainer.classList.add(className);
        ratingContainer.classList.add("list-cell");
        this.append(ratingContainer);
    }
}

function createListRow(className) {
    let listRow = document.createElement("div", { is: "list-row" });
    listRow.classList.add("list-row");
    listRow.classList.add(className);
    return listRow;
}

export { ListRow, createListRow };
