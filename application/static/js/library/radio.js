import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Icon, EditableInfo } from "../shared/widgets.js";
import { Rating } from "../api.js";
import { Container, ContainerDefinition } from "../application.js";

function StationEditor() {

    let def = new ContainerDefinition("div", [ ], "station-editor");
    let data = { stationId: null };
    Container.call(this, data, def);

    let heading = document.createElement("div");
    heading.classList.add("station-edit-heading");
    heading.classList.add("section-heading");

    let headingText = document.createElement("span");
    headingText.classList.add("station-edit-text");
    heading.append(headingText);

    this.root.append(heading);

    let name    = new EditableInfo([ "station-edit-data" ]);
    let website = new EditableInfo([ "station-edit-data" ]);
    let url     = new EditableInfo([ "station-edit-data" ]);

    this.root.append(name.root);
    this.root.append(website.root);
    this.root.append(url.root);

    this.save = () => { name.save(); website.save(); url.save(); }

    this.reset = () => { name.reset(); website.reset(); url.reset(); }

    this.update = (context) => {
        this.save();
        let data = { id: this.data.stationId, name: name.data, website: website.data, url: url.data };
        if (context == "add")
            this.api.createStation(data, this.refreshStations);
        else if (context == "save")
            this.api.saveStation(data, this.refreshStations);
        this.setContent(null);
    }

    let addIcon   = new Icon("add", e => this.update("add"), [ "station-edit-action" ]);
    let saveIcon  = new Icon("save", e => this.update("save"), [ "station-edit-action" ]);
    let undoIcon  = new Icon("undo", e => this.reset(), [ "station-edit-action" ]);
    let clearIcon = new Icon("clear", e => this.setContent(null), [ "station-edit-action" ]);

    let icons = document.createElement("span");
    icons.classList.add("station-edit-icons");
    heading.append(icons);

    for (let icon of [ addIcon, saveIcon, undoIcon, clearIcon ])
        icons.append(icon.root);

    this.setContent = (station) => {
        if (station == null) {
            this.data.stationId = null;
            headingText.innerText = "New Station";
            name.configure("", "name", "Name");
            website.configure("", "website", "Website");
            url.configure("", "url", "Stream URL");
            addIcon.show();
            saveIcon.hide();
            undoIcon.hide();
        } else {
            this.data.stationId = station.id;
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
}
StationEditor.prototype = new Container;

function StationList(stationEditor) {

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

    let getStationData = function(station) {
        return {
            values: [
                station.name,
                { text: station.website, url: station.website },
                station.minutes_listened,
                station.last_listened,
                new Rating("station", station.id, station.rating),
                { name: "create", action: e => stationEditor.setContent(station) },
                { name: "play_arrow", action: e => this.api.streamUrl(station.url) },
                { name: "clear", action: e => this.deleteStation(station.id) },
            ],
            expand: null,
        };
    }

    ListRoot.call(this, columns, getStationData, "stream-list-root");
    this.refresh = function(query) { this.api.query(this.api.station, query, this.update.bind(this)); }

    this.deleteStation = function(stationId) { this.api.deleteStation(stationId, this.refresh.bind(this, this.search.data)); }

    this.search = new SearchBar("station-list-search", this.api.station, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.addHeading();
}
StationList.prototype = new Container;

function RadioContainer() {

    let def = new ContainerDefinition("div", [ ], "radio-container");
    Container.call(this, { }, def);

    let stationEditor = new StationEditor();
    let stationList = new StationList(stationEditor);
    stationEditor.setContent(null);
    stationEditor.refreshStations = stationList.refresh.bind(stationList, stationList.search.data);
    this.root.append(stationEditor.root);
    this.root.append(stationList.root);

    document.title = "Internet Radio"
}
RadioContainer.prototype = new Container;

export { RadioContainer };
