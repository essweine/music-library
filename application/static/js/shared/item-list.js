import { createRatingContainer } from "./rating-container.js";
import { createIcon } from "./icons.js";

function createListRow(className, childRow = false) {

    let row = document.createElement("div");
    (childRow) ? row.classList.add("list-row-child") : row.classList.add("list-row");
    row.classList.add(className);
    row.collapsed = true;
    row.textCells = [ ];

    row.addColumn = (value, colType, className) => {
        if (colType == "text" || value == null) {
            let cell = document.createElement("span");
            cell.innerText = (value != null) ? value : "";
            cell.classList.add(className);
            cell.classList.add("list-cell");
            row.textCells.push(cell);
            row.append(cell);
        } else if (colType == "link") {
            let link = document.createElement("a");
            link.href = value.url;
            link.innerText = value.text;
            link.style["background-color"] = "inherit";
            link.classList.add("list-cell");
            row.append(link);
        } else if (colType == "rating") {
            let ratingContainer = createRatingContainer(value, "list-cell");
            ratingContainer.classList.add(className);
            row.append(ratingContainer);
        } else if (colType == "icon") {
            row.append(createIcon(value.name, value.action, className));
        }
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

function createListRoot(columns, className, rowClass) {

    let root = document.createElement("div");
    root.classList.add("list-root");
    root.classList.add(className);

    root.addHeading = () => {
        let heading = createListRow("list-heading");
        for (let column of columns)
            heading.addColumn(column.display, "text", column.className);
        root.append(heading);
    }

    root.createRow = (data, childRow) => {
        let row = createListRow(rowClass, childRow);
        for (let idx in columns)
            row.addColumn(data.values[idx], columns[idx].type, columns[idx].className);
        if (data.action != null) {
            row.id = data.action.selectId;
            row.setExpandable(data.action.expand, data.action.collapse);
        }
        return row;
    }

    root.addRows = (items) => {
        for (let entry of items) {
            let data = root.getData(entry);
            let row = root.createRow(data, false);
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
