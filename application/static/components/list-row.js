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
        let cell = document.createElement("span");
        cell.classList.add(className);
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.onclick = action;
        cell.append(icon);
        this.append(cell);
    }

    addRatingContainer(recordingId, ratedItem, rating, className) {
        let ratingContainer = createRatingContainer();
        ratingContainer.initialize(recordingId, ratedItem, rating);
        ratingContainer.classList.add(className);
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
