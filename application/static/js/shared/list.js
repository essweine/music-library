import { Icon, RatingDisplay } from "./widgets.js";
import { Container, ContainerDefinition } from "../application.js";

function ListRow(classes, id = null) {

    let def = new ContainerDefinition("div", classes.concat([ "list-row" ]), id);
    let data = { collapsed: true };
    Container.call(this, data, def);

    this.addColumn = function(value, colType, className, rowAction) {
        if (colType == "text" || value == null) {
            let cell = document.createElement("span");
            cell.innerText = (value != null) ? value : "";
            cell.classList.add(className);
            cell.classList.add("list-cell");
            if (rowAction != null) {
                cell.onclick = e => {
                    (this.data.collapsed) ? rowAction.expand() : rowAction.collapse();
                    this.data.collapsed = !this.data.collapsed;
                }
            }
            this.root.append(cell);
        } else if (colType == "link") {
            let link = document.createElement("a");
            link.href = value.url;
            link.innerText = value.text;
            link.style["background-color"] = "inherit";
            link.classList.add("list-cell");
            this.root.append(link);
        } else if (colType == "rating") {
            let ratingDisplay = new RatingDisplay(value, [ className, "list-cell" ]);
            this.root.append(ratingDisplay.root);
        } else if (colType == "icon") {
            let icon = new Icon(value.name, value.action, [ className ]);
            this.root.append(icon.root);
        }
    }
}
ListRow.prototype = new Container;

function ListRoot(columns, defaultRow, id) {

    let def = new ContainerDefinition("div", [ "list-root" ], id);
    Container.call(this, columns, def);

    let expand = (rowId, createRow) => {
        return function(items) {
            let selected = document.getElementById(rowId);
            selected.classList.add([ "list-row-expanded" ]);
            let next = selected.nextElementSibling;
            this.addRows(items, createRow, [ "child-" + rowId, "list-row-expanded" ], next);
        };
    }

    let collapse = (rowId) => {
        let selected = document.getElementById(rowId);
        selected.classList.remove("list-row-expanded");
        for (let row of Array.from(this.root.getElementsByClassName("child-" + rowId)))
            row.remove();
    }

    this.addRows = function(items, rowType, classes = [ ], before = null) {
        for (let entry of items) {
            let data = rowType(entry);
            let rowId = (data.expand) ? data.expand.id.replace(/\s+/g, "-") : null;
            let action = null;
            if (data.expand) {
                let createRow = expand(rowId, data.expand.createRow);
                action = {
                    expand: e => data.expand.getRows(data.expand.id, createRow.bind(this)),
                    collapse: e => collapse(rowId),
                };
            }
            let row = new ListRow(classes, rowId);
            for (let idx in data.values)
                row.addColumn(data.values[idx], this.data[idx].type, this.data[idx].className, action);
            let footer = this.root.getElementsByClassName("list-footer");
            if (before != null)
                this.root.insertBefore(row.root, before);
            else if (footer.length > 0)
                this.root.insertBefore(row.root, footer[0]);
            else
                this.root.append(row.root);
        }
    }

    this.addHeading = function() {
        let heading = new ListRow([ "list-heading" ]);
        for (let column of this.data)
            heading.addColumn(column.display, "text", column.className);
        this.root.append(heading.root);
    }

    this.addFooter = function(footer) {
        footer.classList.add("list-footer");
        this.root.append(footer);
    }

    this.clear = function() {
        for (let row of Array.from(this.root.getElementsByClassName("list-row")))
            if (!row.classList.contains("list-heading"))
                row.remove();
    }

    this.update = function(items) {
        this.clear();
        this.addRows(items, defaultRow);
    }
}

export { ListRoot };
