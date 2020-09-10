import { createIcon } from "/static/components/shared/icons.js";

function createSelect(text, values) {
    let select = document.createElement("select");
    for (let idx in text) {
        let option = document.createElement("option");
        option.innerText = text[idx];
        option.value = values[idx];
        select.append(option);
    }
    return select;
}

function addCheckbox(container, recordingType, className) {

    let span = document.createElement("span");
    span.classList.add(className);

    let text = document.createElement("span");
    text.innerText = recordingType;
    span.append(text);

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.oninput = e => {
        container.query[recordingType.toLowerCase()] = checkbox.checked;
        container.updateResults();
    }
    span.append(checkbox);

    container.append(span);
}

function updateSearch(container, exclude) {

    let selected = container.select.value;
    let value    = ([ "rating", "sound_rating" ].includes(selected)) ? container.ratingValue.value : container.textInput.value;

    let criterion = document.createElement("div");
    criterion.classList.add("list-search-criterion");
    criterion.data = { };
    criterion.data[selected] = value;
    criterion.exclude = exclude;

    let queryType = (criterion.exclude) ? container.query.exclude : container.query.match;
    queryType.push(criterion.data);

    let visibility = document.createElement("span");
    visibility.classList.add("material-icons");
    visibility.classList.add("list-search-hidden");
    visibility.innerText = (exclude) ? "visibility_off" : "visibility";
    criterion.append(visibility);

    let critName = document.createElement("span");
    critName.classList.add("list-search-name");
    critName.innerText = container.critNames[container.critValues.indexOf(selected)]
    criterion.append(critName);

    let critValue = document.createElement("span");
    critValue.classList.add("list-search-value");
    critValue.innerText = value;
    criterion.append(critValue);

    let removeIcon = createIcon("clear", container.removeCriterion(criterion), "list-search-remove");
    criterion.append(removeIcon);

    container.append(criterion);
}

function createSearchBar(root) {

    let container = document.createElement("div");
    container.query = { 
        match: [ ],
        exclude: [ ],
        official: true,
        nonofficial: true
    };
    container.classList.add("list-search-bar");

    let label = document.createElement("span");
    label.classList.add("list-search-label");
    label.innerText = "Search";
    container.append(label);

    container.critNames = [ "Artist", "Contains Track", "Minimum Rating", "Minimum Sound Rating", "Date" ];
    container.critValues = [ "artist", "track_title", "rating", "sound_rating", "recording_date" ]

    container.select = createSelect(container.critNames, container.critValues);
    container.select.classList.add("list-search-select");
    container.append(container.select);
    
    container.select.oninput = e => {
        if ([ "artist", "recording_title", "track_title" ].includes(e.target.value)) {
            container.ratingValue.remove();
            container.insertBefore(container.textInput, showIcon);
        } else if ([ "rating", "sound_rating" ].includes(e.target.value)) {
            container.textInput.remove();
            container.insertBefore(container.ratingValue, showIcon);
        } else if (e.target.value == "recording_date") {
            container.ratingValue.remove();
            container.insertBefore(container.textInput, showIcon);
            let date = new Date(Date.now());
            let month = (date.getMonth() + 1).toString().padStart(2, "0");
            let day = date.getDate().toString().padStart(2, "0");
            container.textInput.value = "****" + "-" + month + "-" + day;
        }
    }

    container.textInput = document.createElement("input");
    container.textInput.classList.add("list-text-search");
    container.textInput.type = "text";
    container.textInput.name = "search-criteria";
    container.append(container.textInput);

    container.ratingValue = createSelect([ "1", "2", "3", "4", "5", "Unrated" ], [ "1", "2", "3", "4", "5", null ]);

    container.updateResults = () => root.updateRecordings(container.query);

    container.addCriterion = (exclude) => {
        return function(e) {
            updateSearch(container, exclude);
            container.updateResults();
        }
    }

    container.removeCriterion = (criterion) => {
        return function(e) {
            let queryType = (criterion.exclude) ? container.query.exclude : container.query.match;
            queryType.splice(queryType.indexOf(criterion.data), 1);
            criterion.remove();
            container.updateResults();
        }
    }

    let showIcon = createIcon("visibility", container.addCriterion(false), "list-search-show");
    container.append(showIcon);

    let hideIcon = createIcon("visibility_off", container.addCriterion(true), "list-search-hide");
    container.append(hideIcon);

    addCheckbox(container, "Official", "list-search-official");
    addCheckbox(container, "Nonofficial", "list-search-nonofficial");

    return container;
}

export { createSearchBar };
