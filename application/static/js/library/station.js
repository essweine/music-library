import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Icon, EditableInfo } from "../shared/widgets.js";
import { StreamEditor } from "./stream.js";

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

    let getStationData = (station) => {
        return {
            values: [
                station.name,
                { text: station.website, url: station.website },
                station.minutes_listened,
                station.last_listened,
                Container.createRating("station", station.id, station.rating),
                { name: "create", action: e => stationEditor.setContent(station) },
                { name: "play_arrow", action: e => this.streamUrl(station.url) },
                { name: "clear", action: e => this.deleteStation(station.id) },
            ],
            expand: null,
        };
    }

    ListRoot.call(this, columns, getStationData, "stream-list-root");

    this.refresh = function(query) { this.query(this.stationApi, query, this.update.bind(this)); }

    this.deleteStation = function(stationId) { this.deleteItem(this.stationApi, stationId, this.refresh.bind(this, this.search.data)); }

    this.search = new SearchBar("station-list-search", this.stationApi, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.addHeading();
}
StationList.prototype = new ListRoot;

function StationContainer() {

    Container.init.call(this, "div", "stream-container");

    let stationEditor = new StreamEditor("station");
    let stationList = new StationList(stationEditor);
    stationEditor.setContent(null);
    // This makes no fucking sense.
    stationEditor.refreshStreams = () => stationList.refresh.call(stationList, stationList.search.data);
    this.root.append(stationEditor.root);
    this.root.append(stationList.root);

    document.title = "Internet Radio";
}
StationContainer.prototype = Container;

export { StationContainer };
