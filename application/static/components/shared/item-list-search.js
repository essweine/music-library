import { createIcon } from "./icons.js";

function createSearchBar(root, query) {

    let container = document.createElement("div");
    container.classList.add("list-search-bar");

    container.query = query;

    let label = document.createElement("span");
    label.classList.add("list-search-label");
    label.innerText = "Search";
    container.append(label);

    container.select = document.createElement("select");
    container.select.classList.add("list-search-select");
    container.append(container.select);

    container.paramText = { };
    container.elements = { };
    container.currentElement = null;

    container.addQueryOption = (text, name, elem) => {
        let option = document.createElement("option");
        option.innerText = text;
        option.value = name;
        container.select.append(option);
        container.elements[name] = elem;
        container.paramText[name] = text;
    }

    container.select.oninput = e => {
        let elem = container.elements[e.target.value];
        if (container.currentElement != null)
            container.currentElement.remove();
        container.insertBefore(elem, showIcon);
        container.currentElement = elem;
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

            let name  = container.select.value;
            let value = container.elements[name].value;

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
            paramText.innerText = container.paramText[name];
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
