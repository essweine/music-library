import { Icon, RatingDisplay } from "./widgets.js";
import { Container, ContainerDefinition } from "../application.js";

function SearchOptions() {

    let def = new ContainerDefinition("select", [ "list-search-select" ]);
    Container.call(this, { }, def);

    let ratingSelect = document.createElement("select");
    for (let rating of [ "1", "2", "3", "4", "5" ]) {
        let option = document.createElement("option");
        option.value = rating;
        option.innerText = rating;
        ratingSelect.append(option)
    }

    let createTextInput = function() {
        let input = document.createElement("input");
        input.classList.add("list-text-search");
        input.type = "text";
        input.name = "search-criteria";
        return input;
    }
    let textInput = createTextInput();
    let dateInput = createTextInput();
    let now = new Date();
    dateInput.value = "*-" + (now.getMonth() + 1) + "-" + now.getDate();

    let paramInput = { };
    let currentElement = null;

    this.configure = function(config) {
        this.data = config;
        for (let [ param, details ] of Object.entries(config)) {

            let option = document.createElement("option");
            option.innerText = details.display;
            option.value = param;
            this.root.append(option);

            if (details.type == "options") {
                let propValues = document.createElement("select");
                for (let value of details.values) {
                    let option = document.createElement("option");
                    option.innerText = value;
                    option.value = value;
                    propValues.append(option);
                }
                paramInput[param] = propValues;
            } else if (details.type == "rating") {
                paramInput[param] = ratingSelect;
            } else if (details.type == "date_search") {
                paramInput[param] = dateInput;
            } else {
                paramInput[param] = textInput;
            }
        }
        this.root.dispatchEvent(new Event("input"));
    }

    this.root.oninput = function(e) {
        if (currentElement != null)
            currentElement.remove();
        currentElement = paramInput[e.target.value];
        this.insertAdjacentElement("afterend", currentElement);
    }

    this.getParam = function(exclude) {
        let name = this.root.value;
        return {
            exclude: exclude,
            name: name,
            value: paramInput[name].value,
            display: this.data[name].display,
        };
    }
}
SearchOptions.prototype = new Container;

function SearchParam(data, remove) {

    let def = new ContainerDefinition("div", [ "list-search-criterion" ]);
    Container.call(this, data, def);

    let visibility = document.createElement("span");
    visibility.classList.add("material-icons");
    visibility.classList.add("list-search-hidden");
    visibility.innerText = (data.exclude) ? "visibility_off" : "visibility";
    this.root.append(visibility);

    let paramName = document.createElement("span");
    paramName.classList.add("list-search-name");
    paramName.innerText = data.display;
    this.root.append(paramName);

    let paramValue = document.createElement("span");
    paramValue.classList.add("list-search-value");
    paramValue.innerText = data.value;
    this.root.append(paramValue);

    let removeIcon = new Icon("clear", e => remove(this), [ "list-search-remove" ]);
    this.root.append(removeIcon.root);
}
SearchParam.prototype = new Container;

function SearchBar(classes, updateResults) {

    let def = new ContainerDefinition("div", classes.concat([ "list-search-bar" ]))
    Container.call(this, { }, def);

    this.currentQuery = function() { return this.data; }

    this.addCheckbox = function(paramText, queryParam, className) {

        let span = document.createElement("span");
        span.classList.add(className);

        let text = document.createElement("span");
        text.innerText = paramText;
        span.append(text);

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.data[queryParam];
        checkbox.oninput = e => {
            this.data[queryParam] = checkbox.checked;
            updateResults(this.data);
        }
        span.append(checkbox);

        this.root.append(span);
    }

    this.removeParam = function(param) {
        let queryType = (param.data.exclude) ? this.data.exclude : this.data.match;
        let queryData = Object.fromEntries([ [ param.data.name, param.data.value ] ]);
        queryType.splice(queryType.indexOf(queryData), 1);
        param.root.remove();
        updateResults(this.data);
    }

    this.addParam = function(exclude) {
        let paramData = select.getParam(exclude);
        let queryData = Object.fromEntries([ [ paramData.name, paramData.value ] ]);
        (exclude) ? this.data.exclude.push(queryData) : this.data.match.push(queryData);
        let param = new SearchParam(paramData, this.removeParam.bind(this));
        this.root.append(param.root);
        updateResults(this.data);
    }

    this.setSort = function(sort) { this.data.sort = sort; }

    let label = document.createElement("span");
    label.classList.add("list-search-label");
    label.innerText = "Search";
    this.root.append(label);

    let select = new SearchOptions(this.addParam);
    this.root.append(select.root);

    this.configure = (config) => {
        this.data = config.default_query;
        select.configure(config.search_options); 
        for (let name of Object.keys(config.checkboxes))
            this.addCheckbox(config.checkboxes[name], name, "list-search-" + name);
        updateResults(this.data);
    }

    let showIcon = new Icon("visibility", e => this.addParam(false), [ "list-search-show" ]);
    this.root.append(showIcon.root);

    let hideIcon = new Icon("visibility_off", e => this.addParam(true), [ "list-search-hide" ]);
    this.root.append(hideIcon.root);
}
SearchBar.prototype = new Container;

function ListRow(classes, id = null) {

    let def = new ContainerDefinition("div", classes.concat([ "list-row" ]), id);
    let data = { collapsed: true };
    Container.call(this, data, def);

    this.addColumn = function(value, colType, className, action) {
        if (colType == "text" || value == null) {
            let cell = document.createElement("span");
            cell.innerText = (value != null) ? value : "";
            cell.classList.add(className);
            cell.classList.add("list-cell");
            if (action != null) {
                cell.onclick = e => {
                    (this.data.collapsed) ? action.expand() : action.collapse();
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

function ListRoot(columns, classes) {

    let def = new ContainerDefinition("div", classes.concat([ "list-root" ]));
    Container.call(this, columns, def);

    this.addHeading = function() {
        let heading = new ListRow([ "list-heading" ]);
        for (let column of this.data)
            heading.addColumn(column.display, "text", column.className);
        this.root.append(heading.root);
    }

    this.createRow = function(data, classes = [ ]) {
        let row = new ListRow(classes, data.id);
        for (let idx in data.values)
            row.addColumn(data.values[idx], this.data[idx].type, this.data[idx].className, data.action);
        return row;
    }

    this.addRows = function(items) {
        for (let entry of items) {
            let data = this.getData(entry);
            let row = this.createRow(data);
            this.root.append(row.root);
        }
    }

    this.clear = function() {
        for (let row of Array.from(this.root.getElementsByClassName("list-row")))
            if (!row.classList.contains("list-heading"))
                row.remove();
    }

    this.update = function(items) {
        this.clear();
        this.addRows(items);
    }
}

export { ListRoot, SearchBar };
