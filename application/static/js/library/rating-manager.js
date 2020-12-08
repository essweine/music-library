import { Container, ContainerDefinition } from "../application.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Options } from "../shared/widgets.js";
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

function RatingAggregation(apiPath, columns, sort, createRow) {

    let def = new ContainerDefinition("div", [ ]);
    Container.call(this, { }, def);

    let chart = new BarChart([ "rating-chart" ]);
    this.root.append(chart.root);

    chart.addBar("Unrated", "rating-bar-unrated");
    [ "1", "2", "3", "4", "5" ].map(rating => chart.addBar(rating, "rating-bar-" + rating));

    let updateChart = (ratings) => {
        chart.reset();
        let total = 0.0;
        ratings.map(rating => total += rating.total );
        ratings.map(rating => {
            let bar = (rating.rating == null) ? "rating-bar-unrated": "rating-bar-" + rating.rating;
            chart.setValue(bar, (100* rating.total / total) + "%", rating.total);
        });
    }

    let refresh = (query = search.data) => {
        search.setSort(sort);
        this.api.aggregate(apiPath, "rating", query, updateChart);
    }
    let search = new SearchBar("aggregate-search", apiPath, refresh);
    this.root.append(search.root);

    let results = new ListRoot(columns, createRow, "aggregate-search-results");
    results.addHeading();

    let showResults = e => {
        this.api.query(apiPath, search.data, results.update.bind(results));
        this.root.append(results.root);
    }

    let options = new Options([ ], "aggregate-results-toggle");
    options.addOption("Show Results", showResults);
    options.addOption("Hide Results", e => results.root.remove(), true);

    this.root.append(options.root);
}
RatingAggregation.prototype = new Container;

function RatingManager() {

    let def = new ContainerDefinition("div", [ ], "rating-manager");
    Container.call(this, { }, def);

    let trackColumns = [
        { display: "Title", className: "track-list-title", type: "text" },
        { display: "Recording", className: "track-list-recording", type: "text" },
        { display: "Artist", className: "track-list-artist", type: "text" },
        { display: "Rating", className: "track-list-rating", type: "rating" },
    ];
    let trackSort = [ "rating", "title" ];
    let getTrackData = (track) => {
        return {
            values: [ track.title, track.recording, track.artist, new Rating("track", track.filename, track.rating) ],
            expand: null,
        }
    }
    let trackAgg = new RatingAggregation(this.api.track, trackColumns, trackSort, getTrackData);

    let recordingColumns = [
        { display: "Artist", className: "recording-list-artist", type: "text" },
        { display: "Title", className: "recording-list-title", type: "text" },
        { display: "Rating", className: "recording-list-rating", type: "rating" },
    ];
    let recordingSort = [ "rating", "artist", "title" ];
    let getRecordingData = (recording) => {
        return {
            values: [ recording.artist, recording.title, new Rating("recording-rating", recording.id, recording.rating) ],
            expand: null,
        }
    }
    let recordingAgg = new RatingAggregation(this.api.recording, recordingColumns, recordingSort, getRecordingData);

    let showTrackAgg = e => {
        recordingAgg.root.remove();
        this.root.append(trackAgg.root);
    }
    let showRecordingAgg = e => {
        trackAgg.root.remove();
        this.root.append(recordingAgg.root);
    }
    let options = new Options([ ], "aggregate-query-select");
    options.addText("Show Aggregate for");
    options.addOption("Tracks", showTrackAgg);
    options.addOption("Recordings", showRecordingAgg);

    this.root.append(options.root);
    this.root.append(trackAgg.root);
}
RatingManager.prototype = new Container;

export { RatingManager };
