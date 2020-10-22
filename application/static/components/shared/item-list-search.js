import { createIcon } from "./icons.js";
import { createRatingSelector } from "../shared/rating-container.js";

function createSearchBar(root, query) {

    let container = document.createElement("div");
    container.classList.add("list-search-bar");

    container.query = query;

    let label = document.createElement("span");
    label.classList.add("list-search-label");
    label.innerText = "Search";
    container.append(label);

    let select = document.createElement("select");
    select.classList.add("list-search-select");
    container.append(select);

    let paramDisplay = { };
    let paramElements = { };
    let currentElement = null;

    container.initialize = (config) => {
        for (let [ param, details ] of Object.entries(config)) {

            let option = document.createElement("option");
            option.innerText = details.display;
            option.value = param;
            select.append(option);

            if (details.type == "rating") {
                paramElements[param] = createRatingSelector();
            } else if (details.type == "options") {
                let propValues = document.createElement("select");
                for (let value of details.values) {
                    let option = document.createElement("option");
                    option.innerText = value;
                    option.value = value;
                    propValues.append(option);
                }
                paramElements[param] = propValues;
            } else {
                let textInput = document.createElement("input");
                textInput.classList.add("list-text-search");
                textInput.type = "text";
                textInput.name = "search-criteria";
                paramElements[param] = textInput;
            }

            if (details.type == "date_search") {
                let now = new Date();
                paramElements[param].value = "*-" + (now.getMonth() + 1) + "-" + now.getDate();
            }

            paramDisplay[param] = details.display;
        }
        select.dispatchEvent(new Event("input"));
    }

    select.oninput = e => {
        let elem = paramElements[e.target.value];
        if (currentElement != null)
            currentElement.remove();
        container.insertBefore(elem, showIcon);
        currentElement = elem;
    }

    container.addCheckbox = (paramText, queryParam, className) => {

        let span = document.createElement("span");
        span.classList.add(className);

        let text = document.createElement("span");
        text.innerText = paramText;
        span.append(text);

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = container.query[queryParam];
        checkbox.oninput = e => {
            container.query[queryParam] = checkbox.checked;
            root.updateResults(container.query);
        }
        span.append(checkbox);

        container.append(span);
    }

    container.addParam = (exclude) => {

        return function(e) {

            let name  = select.value;
            let value = paramElements[name].value;

            let param = document.createElement("div");
            param.classList.add("list-search-criterion");
            param.data = { };
            param.data[name] = value;
            param.exclude = exclude;

            (exclude) ? container.query.exclude.push(param.data) : container.query.match.push(param.data);

            let visibility = document.createElement("span");
            visibility.classList.add("material-icons");
            visibility.classList.add("list-search-hidden");
            visibility.innerText = (exclude) ? "visibility_off" : "visibility";
            param.append(visibility);

            let paramText = document.createElement("span");
            paramText.classList.add("list-search-name");
            paramText.innerText = paramDisplay[name];
            param.append(paramText);

            let paramValue = document.createElement("span");
            paramValue.classList.add("list-search-value");
            paramValue.innerText = value;
            param.append(paramValue);

            let removeIcon = createIcon("clear", container.removeParam(param), "list-search-remove");
            param.append(removeIcon);

            container.append(param);
            root.updateResults(container.query);
        }
    }

    container.removeParam = (param) => {
        return function(e) {
            let queryType = (param.exclude) ? container.query.exclude : container.query.match;
            queryType.splice(queryType.indexOf(param.data), 1);
            param.remove();
            root.updateResults(container.query);
        }
    }

    let showIcon = createIcon("visibility", container.addParam(false), "list-search-show");
    container.append(showIcon);

    let hideIcon = createIcon("visibility_off", container.addParam(true), "list-search-hide");
    container.append(hideIcon);

    return container;
}

export { createSearchBar };
