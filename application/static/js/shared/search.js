import { Icon } from "./widgets.js";
import { Container } from "../container.js";

function SearchOptions(update) {

    Container.init.call(this, "select", null, [ "list-search-select" ]);
    this.root.onkeypress = e =>  { if (e.keyCode == 13) update(); };

    let ratingSelect = document.createElement("select");
    for (let rating of [ "1", "2", "3", "4", "5" ]) {
        let option = document.createElement("option");
        option.value = rating;
        option.innerText = rating;
        ratingSelect.append(option)
    }
    ratingSelect.oninput = e => update();

    let createTextInput = () => {
        let input = this.createElement("input", null, [ "list-text-search" ]);
        input.type = "text";
        input.name = "search-criteria";
        input.onkeypress = e => { if (e.keyCode == 13) update(); };
        return input;
    }
    let textInput = createTextInput();
    let dateInput = createTextInput();
    let now = new Date();
    dateInput.value = "*-" + (now.getMonth() + 1) + "-" + now.getDate();

    let paramInput = { };
    let currentElement = null;

    this.configure = function(config, update) {
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
                propValues.oninput = e => update();
                propValues.onkeypress = e => { if (e.keyCode == 13) update(); }
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
SearchOptions.prototype = Container;

function SearchParam(data, remove) {

    Container.init.call(this, "div", null, [ "list-search-criterion" ]);
    this.data = data;

    let visibility = this.createElement("span", null, [ "material-icons", "list-search-hidden" ]);
    visibility.innerText = (data.exclude) ? "visibility_off" : "visibility";
    this.root.append(visibility);

    let paramName = this.createElement("span", null, [ "list-search-name" ]);
    paramName.innerText = data.display;
    this.root.append(paramName);

    let paramValue = this.createElement("span", [ "list-search-value" ]);
    paramValue.innerText = data.value;
    this.root.append(paramValue);

    let removeIcon = new Icon("clear", e => remove(this), [ "list-search-remove" ]);
    this.root.append(removeIcon.root);
}
SearchParam.prototype = Container;

function SearchBar(id, apiPath, update) {

    Container.init.call(this, "div", id, [ "list-search-bar" ]);

    let label = this.createElement("span", [ "list-search-label" ]);
    label.innerText = "Search";
    this.root.append(label);

    this.removeParam = function(param) {
        let queryType = (param.data.exclude) ? this.data.query.exclude : this.data.query.match;
        let queryData = Object.fromEntries([ [ param.data.name, param.data.value ] ]);
        queryType.splice(queryType.indexOf(queryData), 1);
        param.root.remove();
        update(this.data.query);
    }

    this.addParam = function() {
        let paramData = select.getParam(this.data.exclude);
        let queryData = Object.fromEntries([ [ paramData.name, paramData.value ] ]);
        (this.data.exclude) ? this.data.query.exclude.push(queryData) : this.data.query.match.push(queryData);
        let param = new SearchParam(paramData, this.removeParam.bind(this));
        this.root.append(param.root);
        update(this.data.query);
    }

    let select = new SearchOptions(this.addParam.bind(this));
    this.root.append(select.root);

    this.setSort = (sort) => { this.data.query.sort = sort; }

    let addCheckbox = (paramText, queryParam, className) => {
        let span = this.createElement("span", null, [ className ]);
        let text = document.createElement("span");
        text.innerText = paramText;
        span.append(text);

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.data.query[queryParam];
        checkbox.oninput = e => {
            this.data.query[queryParam] = checkbox.checked;
            update(this.data.query);
        }
        span.append(checkbox);
        this.root.append(span);
    }

    let visibility = this.createElement("span", null, [ "material-icons", "list-search-show" ]);
    let setExclude = (val) => {
        this.data.exclude = val;
        visibility.innerText = (this.data.exclude) ? "visibility_off" : "visibility";
    }
    visibility.onclick = e => setExclude(!this.data.exclude);
    this.root.append(visibility);

    let configure = (config) => {
        this.data = {
            query: config.default_query,
            exclude: false,
        };
        select.configure(config.search_options, this.addParam.bind(this)); 
        for (let name of Object.keys(config.checkboxes))
            addCheckbox(config.checkboxes[name], name, "list-search-" + name);
        setExclude(this.data.exclude);
        update(this.data.query);
    }

    this.getSearchConfig(apiPath, configure);
}
SearchBar.prototype = Container;

export { SearchBar };
