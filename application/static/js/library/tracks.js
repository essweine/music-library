import { Container, ContainerDefinition } from "../application.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Rating } from "../api.js";

function BarChart(classes) {

    let def = new ContainerDefinition("div", classes.concat([ "bar-chart" ]));
    Container.call(this, { }, def);

    this.addBar = (label, id) => {

        let bar = document.createElement("span");
        bar.id = id;
        bar.classList.add("bar");

        let yLabel = document.createElement("span");
        yLabel.classList.add("bar-label");
        yLabel.innerText = label;
        bar.append(yLabel);

        let barData = document.createElement("span");
        barData.classList.add("bar-data");
        bar.append(barData);

        let rect = document.createElement("span");
        rect.classList.add("bar-rect");
        barData.append(rect);

        let barLabel = document.createElement("span");
        barLabel.classList.add("bar-text");
        barData.append(barLabel);

        this.data[id] = { rect: rect, barLabel: barLabel, yLabel: yLabel };
        this.root.append(bar);
    }

    this.setValue = (id, value, text) => {
        this.data[id].rect.style.width = value;
        this.data[id].barLabel.innerText = text;
    }

    this.reset = () => Object.keys(this.data).map(id => this.setValue(id, "0%", "0"));
}

function RatingAggregation() {

    let def = new ContainerDefinition("div", [ ]);
    Container.call(this, { }, def);

    let chart = new BarChart([ "rating-chart" ]);
    this.root.append(chart.root);

    chart.addBar("Unrated", "rating-bar-unrated");
    [ "1", "2", "3", "4", "5" ].map(rating => chart.addBar(rating, "rating-bar-" + rating));

    let updateChart = (ratings) => {
        chart.reset();
        let total = 0.0;
        ratings.map(rating => total += rating.tracks );
        ratings.map(rating => {
            let bar = (rating.rating == null) ? "rating-bar-unrated": "rating-bar-" + rating.rating;
            chart.setValue(bar, (100* rating.tracks / total) + "%", rating.tracks);
        });
    }

    let refresh = (query = search.data) => {
        search.setSort([ "rating", "title" ]);
        this.api.aggregate(this.api.track, "rating", query, updateChart);
        this.api.query(this.api.track, search.data, tracks.update.bind(tracks));
    }
    let search = new SearchBar("track-aggregate-search", this.api.track, refresh);
    this.root.append(search.root);

    let columns = [
        { display: "Title", className: "track-list-title", type: "text" },
        { display: "Recording", className: "track-list-recording", type: "text" },
        { display: "Artist", className: "track-list-artist", type: "text" },
        { display: "Rating", className: "track-list-rating", type: "rating" },
    ];

    let getTrackData = (track) => {
        return {
            values: [
                track.title,
                track.recording,
                track.artist,
                new Rating("track", track.filename, track.rating),
            ],
            expand: null,
        }
    }
    let tracks = new ListRoot(columns, getTrackData, "track-search-results");
    tracks.addHeading();

    let options = document.createElement("span");
    options.classList.add("aggregate-query-options");

    let show = document.createElement("span");
    show.classList.add("aggregate-query-option");
    show.innerText = "Show Tracks";
    show.onclick = (e) => { this.root.append(tracks.root); }
    options.append(show);

    let hide = document.createElement("span");
    hide.classList.add("aggregate-query-option");
    hide.innerText = "Hide Tracks";
    hide.onclick = (e) => {
        tracks.root.remove();
    }
    options.append(hide);

    this.root.append(options);
}
RatingAggregation.prototype = new Container;

export { RatingAggregation };
