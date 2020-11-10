import { createListRoot, createListRow } from "./shared/item-list.js";
import { createSearchBar } from "./shared/item-list-search.js";
import { createIcon } from "./shared/icons.js";
import { createEditableInfo } from "./shared/editable-info.js";
import { Rating } from "./api.js";

function createStationEditor(api) {

    let editor = document.createElement("div");
    editor.id = "station-editor";

    let heading = document.createElement("div");
    heading.classList.add("station-edit-heading");
    heading.classList.add("section-heading");

    let headingText = document.createElement("span");
    headingText.classList.add("station-edit-text");
    heading.append(headingText);

    editor.append(heading);

    let name    = createEditableInfo("station-edit-data");
    let website = createEditableInfo("station-edit-data");
    let url     = createEditableInfo("station-edit-data");

    editor.append(name);
    editor.append(website);
    editor.append(url);

    editor.save = () => { name.save(); website.save(); url.save(); }

    editor.reset = () => { name.reset(); website.reset(); url.reset(); }

    editor.update = (context) => {
        editor.save();
        let data = { id: editor.stationId, name: name.get(), website: website.get(), url: url.get() };
        if (context == "add")
            api.addStation(data, editor.refreshStations);
        else if (context == "save")
            api.saveStation(data, editor.refreshStations);
        editor.setContent(null);
    }

    let addIcon   = createIcon("add", e => editor.update("add"), "station-edit-action");
    let saveIcon  = createIcon("save", e => editor.update("save"), "station-edit-action");
    let undoIcon  = createIcon("undo", e => editor.reset(), "station-edit-action");
    let clearIcon = createIcon("clear", e => editor.setContent(null), "station-edit-action");

    let icons = document.createElement("span");
    icons.classList.add("station-edit-icons");
    heading.append(icons);

    for (let icon of [ addIcon, saveIcon, undoIcon, clearIcon ])
        icons.append(icon);

    editor.setContent = (station) => {
        if (station == null) {
            editor.stationId = "new";
            headingText.innerText = "New Station";
            name.initialize("", "name", "Name");
            website.initialize("", "website", "Website");
            url.initialize("", "url", "Stream URL");
            addIcon.show();
            saveIcon.hide();
            undoIcon.hide();
        } else {
            editor.stationId = station.id;
            headingText.innerText = "Editing " + station.name;
            name.set(station.name);
            website.set(station.website);
            url.set(station.url);
            addIcon.hide();
            saveIcon.show();
            undoIcon.show();
        }
        name.toggleEdit(true);
        website.toggleEdit(true);
        url.toggleEdit(true);
    }

    return editor;
}

function createStationList(api, stationEditor) {

    let columns = [
        { display: "Name", className: "station-list-name", type: "text" },
        { display: "Website", className: "station-list-website", type: "link" },
        { display: "Minutes Listened", className: "station-list-minutes-listened", type: "text" },
        { display: "Last Listened", className: "station-list-last-listened", type: "text" },
        { display: "Rating", className: "station-list-rating", type: "rating" },
        { display: "", className: "station-list-edit", type: "icon" },
        { display: "", className: "station-list-play", type: "icon" },
        { display: "", className: "station-list-delete", type: "icon" },
    ];

    let root = createListRoot(columns, "stream-list-root");
    root.id = "radio-container";

    let query = { match: [ ], exclude: [ ] }
    
    let search = createSearchBar(root, query, "station-list-search");
    root.configureSearch = (config) => search.initialize(config);
    root.append(search);

    root.updateResults = (query) => api.query("station", query, root.update);

    root.refresh = () => api.query("station", query, root.update);

    root.save = (station) => api.saveStation(station);

    root.deleteStation = (stationId) => api.deleteStation(stationId, root.refresh);

    root.getData = (station) => {
        return {
            values: [
                station.name,
                { text: station.website, url: station.website },
                station.minutes_listened,
                station.last_listened,
                new Rating("station", station.id, station.rating),
                { name: "create", action: e => stationEditor.setContent(station) },
                { name: "play_arrow", action: e => api.streamUrl(station.url) },
                { name: "clear", action: e => root.deleteStation(station.id) },
            ],
            action: null
        };
    }

    root.addHeading();
    return root;
}

function createRadioContainer(api) {

    let container = document.createElement("div");
    let stationEditor = createStationEditor(api);
    container.stationList = createStationList(api, stationEditor);
    stationEditor.setContent(null);
    stationEditor.refreshStations = container.stationList.refresh;
    container.append(stationEditor);
    container.append(container.stationList);
    document.title = "Internet Radio"
    api.getSearchConfig("station", container.stationList.configureSearch);
    api.getAllStations(container.stationList.addRows);
    return container;
}

export { createRadioContainer };
