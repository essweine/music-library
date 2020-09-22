import { createRatingContainer } from "./rating-container.js";
import { createIcon } from "./icons.js";

function createListRow(className, parent = true) {

    let row = document.createElement("div");
    (parent) ? row.classList.add("list-row") : row.classList.add("list-row-child");
    row.classList.add(className);
    row.collapsed = true;
    row.textCells = [ ];

    row.addText = (text, className) => {
        let cell = document.createElement("span");
        cell.innerText = text;
        cell.classList.add(className);
        cell.classList.add("list-cell");
        row.textCells.push(cell);
        row.append(cell);
    }

    row.addIcon = (name, action, classNames) => row.append(createIcon(name, action, classNames));

    row.addRatingContainer = (itemType, itemId, ratingType, rating, className) => {
        let ratingContainer = createRatingContainer("list-cell");
        ratingContainer.configure(itemType, itemId, ratingType, rating);
        ratingContainer.classList.add(className);
        row.append(ratingContainer);
    }

    row.setExpandable = (expand, collapse) => {
        for (let elem of row.textCells)
            elem.onclick = e => {
                (row.collapsed) ? expand() : collapse();
                row.collapsed = !row.collapsed;
            };
    }

    return row;
}

function createListRoot(className) {

    let root = document.createElement("div");
    root.classList.add("list-root");
    root.classList.add(className);

    root.addRows = (items) => {
        for (let entry of items) {
            let row = root.addRow(entry);
            root.append(row);
        }
    }

    root.clear = () => {
        for (let row of Array.from(document.getElementsByClassName("list-row")))
            if (!row.classList.contains("list-heading"))
                row.remove();
        for (let row of Array.from(document.getElementsByClassName("list-row-child")))
            row.remove();
    }

    root.update = (items) => {
        root.clear();
        root.addRows(items);
    }

    return root;
}

export { createListRow, createListRoot };
