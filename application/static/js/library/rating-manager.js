import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Options } from "../shared/widgets.js";

function BarChart(id) {

    Container.init.call(this, "div", id, [ "bar-chart" ]);
    this.data = { };

    this.addBar = function(label, id) {

        let bar = this.createElement("span", id);
        bar.classList.add("bar");

        let yLabel = this.createElement("span", null, [ "bar-label" ]);
        yLabel.innerText = label;
        bar.append(yLabel);

        let barData = this.createElement("span", null, [ "bar-data" ]);
        bar.append(barData);

        let rect = this.createElement("span", null, [ "bar-rect" ]);
        barData.append(rect);

        let barLabel = this.createElement("span", null, [ "bar-text" ]);
        barData.append(barLabel);

        this.data[id] = { rect: rect, barLabel: barLabel, yLabel: yLabel };
        this.root.append(bar);
    }

    this.setValue = function(id, value, text) {
        this.data[id].rect.style.width = value;
        this.data[id].barLabel.innerText = text;
    }

    this.reset = function() { Object.keys(this.data).map(id => this.setValue(id, "0%", "0")); }
}
BarChart.prototype = Container;

function RatingAggregation(apiPath, columns, sort, createRow) {

    Container.init.call(this);

    let chart = new BarChart("rating-chart");
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
        this.aggregate(apiPath, "rating", query, updateChart);
    }
    let search = new SearchBar("aggregate-search", apiPath, refresh);
    this.root.append(search.root);

    let results = new ListRoot(columns, createRow, "aggregate-search-results");
    results.addHeading();

    let showResults = e => {
        this.query(apiPath, search.data, results.update.bind(results));
        this.root.append(results.root);
    }

    let options = new Options([ ], "aggregate-results-toggle");
    options.addOption("Show Results", showResults);
    options.addOption("Hide Results", e => results.root.remove(), true);
    this.root.append(options.root);
}
RatingAggregation.prototype = Container;

function RatingManager() {

    Container.init.call(this, "div", "rating-manager");

    let trackColumns = [
        { display: "Title", className: "track-list-title", type: "text" },
        { display: "Recording", className: "track-list-recording", type: "text" },
        { display: "Artist", className: "track-list-artist", type: "text" },
        { display: "Rating", className: "track-list-rating", type: "rating" },
    ];
    let trackSort = [ "rating", "title" ];
    let getTrackData = (track) => {
        return {
            values: [
                track.title,
                track.recording,
                track.artist,
                this.createRating("track", track.filename, track.rating)
            ],
            expand: null,
        }
    }
    let trackAgg = new RatingAggregation(this.trackApi, trackColumns, trackSort, getTrackData);

    let recordingColumns = [
        { display: "Artist", className: "recording-list-artist", type: "text" },
        { display: "Title", className: "recording-list-title", type: "text" },
        { display: "Rating", className: "recording-list-rating", type: "rating" },
    ];
    let recordingSort = [ "rating", "artist", "title" ];
    let getRecordingData = (recording) => {
        return {
            values: [
                recording.artist,
                recording.title,
                this.createRating("recording-rating", recording.id, recording.rating)
            ],
            expand: null,
        }
    }
    let recordingAgg = new RatingAggregation(this.recordingApi, recordingColumns, recordingSort, getRecordingData);

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
RatingManager.prototype = Container;

export { RatingManager };
