import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Icon, EditableInfo } from "../shared/widgets.js";
import { StreamEditor } from "./stream.js";

function RowFilter(labelText) {

    Container.init.call(this, "div", "podcast-episode-filter");

    let label = this.createElement("span", null, [ "row-filter-label" ]);
    label.innerText = labelText;
    this.root.append(label);

    this.addCheckbox = (filterText, filterId, checked) => {
        let span = this.createElement("span", null, [ "row-filter-checkbox" ]);
        let text = document.createElement("span");
        text.innerText = filterText;
        span.append(text);
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = filterId;
        checkbox.checked = checked;
        span.append(checkbox);
        this.root.append(span);
    }

    this.getValue = (filterId) => { return document.getElementById(filterId).checked; }
}
RowFilter.prototype = Container;

function PodcastList(podcastEditor) {

    let episodeFilter = new RowFilter("Filter Episodes");
    episodeFilter.addCheckbox("Listened Episodes", "listened", false);
    episodeFilter.addCheckbox("Older Episodes", "all", false);

    let columns = [
        { display: "Name", className: "podcast-list-name", type: "text" },
        { display: "Total Episodes", className: "podcast-list-episodes", type: "text" },
        { display: "Unlistened", className: "podcast-list-episodes-unlistened", type: "text" },
        { display: "Most Recent / Date Published", className: "podcast-list-date", type: "text" },
        { display: "Rating", className: "podcast-list-rating", type: "rating" },
        { display: "", className: "podcast-list-edit", type: "icon" },
        { display: "", className: "podcast-list-refresh", type: "icon" },
        { display: "", className: "podcast-list-delete", type: "icon" },
    ];

    let updatePodcastRow = (podcast) => {
        let child = document.getElementById(podcast.id);
        let totalEpisodes = child.getElementsByClassName("podcast-list-episodes").item(0);
        let unlistened    = child.getElementsByClassName("podcast-list-episodes-unlistened").item(0);
        let pubDate       = child.getElementsByClassName("podcast-list-date").item(0);
        totalEpisodes.innerText = podcast.episodes;
        unlistened.innerText    = podcast.unlistened;
        pubDate.innerText       = podcast.date_published;
    }

    let filterEpisodes = (podcastId, createRow) => {
        let listened = episodeFilter.getValue("listened");
        let all = episodeFilter.getValue("all");
        this.getPodcastEpisodes(podcastId, listened, all, createRow);
    }

    let getEpisodeData = (episode) => {
        return {
            values: [
                episode.title,
                null,
                episode.listened_date,
                episode.date_published,
                null,
                null,
                { name: "play_arrow", action: e => this.streamUrl(episode.url) },
                null,
            ],
            expand: null,
        }
    }

    let getPodcastData = (podcast) => {
        return {
            values: [
                podcast.name,
                podcast.episodes,
                podcast.unlistened,
                podcast.date_published,
                Container.createRating("podcast", podcast.id, podcast.rating),
                { name: "create", action: e => podcastEditor.setContent(podcast) },
                { name: "refresh", action: e => this.updatePodcastEpisodes(podcast.id, (r) => updatePodcastRow(r)) },
                { name: "clear", action: e => this.deletePodcast(podcast.id) },
            ],
            expand: { id: podcast.id, getRows: filterEpisodes, createRow: getEpisodeData },
        };
    }

    ListRoot.call(this, columns, getPodcastData, "stream-list-root");

    this.refresh = function(query) { this.query(this.podcastApi, query, this.update.bind(this)); }

    this.deletePodcast = function(podcastId) { this.deleteItem(this.podcastApi, podcastId, this.refresh.bind(this, this.search.data)); }

    this.search = new SearchBar("podcast-list-search", this.podcastApi, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.root.append(episodeFilter.root);
    this.addHeading();
}
PodcastList.prototype = new ListRoot;

function PodcastContainer() {

    Container.init.call(this, "div", "stream-container");

    let podcastEditor = new StreamEditor("podcast");
    let podcastList = new PodcastList(podcastEditor);
    podcastEditor.setContent(null);
    // This makes no fucking sense.
    podcastEditor.refreshStreams = () => podcastList.refresh.call(podcastList, podcastList.search.data);
    this.root.append(podcastEditor.root);
    this.root.append(podcastList.root);

    document.title = "Podcasts";
}
PodcastContainer.prototype = Container;

export { PodcastContainer };
