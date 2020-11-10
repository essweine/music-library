import { createEditableInfo } from "../shared/editable-info.js";
import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";
import { createPlaylistEntry } from "../shared/playlist-entry.js";
import { createTracklistContainer } from "../shared/tracklist-container.js";
import { createRatingContainer } from "../shared/rating-container.js";
import { createIcon } from "../shared/icons.js";
import { Rating } from "../api.js";

function createPlaylistEditor(api, playlistId) {

    let container = document.createElement("div");
    container.id = "playlist-container";

    let heading = document.createElement("div");
    heading.classList.add("section-heading");
    let playlistName = createEditableInfo("playlist-name");
    heading.append(playlistName);
    container.append(heading);

    let save = () => {
        playlistName.save()
        container.playlist.name = playlistName.get();
        container.playlist.filenames = tracklist.getFilenames();
        api.savePlaylist(container.playlist);
    }

    let reset = () => window.location.href = "/playlist";

    let saveIcon   = createIcon("save", e => save(), "playlist-save");
    let cancelIcon = createIcon("clear", e => reset(), "playlist-cancel");
    heading.append(saveIcon);
    heading.append(cancelIcon);

    let tracklist = createTracklistContainer("playlist-entry");
    tracklist.id = "playlist-tracks-editor";

    tracklist.setTracklist = (tracks) => {
        tracklist.clear();
        let entries = tracks.map(track => createPlaylistEntry(tracklist, track));
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            entry.updatePosition(i, i == 0, i == entries.length - 1);
            tracklist.append(entry);
        }
    }

    tracklist.getFilenames = () => { return Array.from(tracklist.getItems()).map(item => item.track.filename); }

    tracklist.addTrack = (track) => {
        let entries = tracklist.getItems();
        let lastEntry = entries.item(entries.length - 1);
        if (lastEntry != null)
            lastEntry.updatePosition(lastEntry.position, lastEntry.position == 0, false);
        let newEntry = createPlaylistEntry(tracklist, track);
        let position = entries.length;
        newEntry.updatePosition(position, position == 0, position == entries.length);
        tracklist.append(newEntry);
    }

    container.append(tracklist);

    let columns = [
        { display: "Title", className: "track-list-title", type: "text" },
        { display: "Recording", className: "track-list-recording", type: "text" },
        { display: "Artist", className: "track-list-artist", type: "text" },
        { display: "Rating", className: "track-list-rating", type: "rating" },
        { display: "", className: "track-list-add", type: "icon" },
    ];
    let searchResults = createListRoot(columns, "playlist-list-root", "playlist-list-row");

    let query = {
        match: [ ],
        exclude: [ ],
        sort: [ "title", "artist" ],
        order: "asc",
        official: true,
        nonofficial: true,
        unrated: false,
    }
    let search = createSearchBar(searchResults, query, "track-list-search");
    container.configureSearch = (config) => search.initialize(config);
    search.addCheckbox("Official", "official", "list-search-official");
    search.addCheckbox("Non-official", "nonofficial", "list-search-nonofficial");
    search.addCheckbox("Unrated Only", "unrated", "list-search-unrated");
    searchResults.append(search);

    searchResults.updateResults = (query) => api.query("track", query, searchResults.update);
    searchResults.getData = (track) => {
        return {
            values: [
                track.title,
                track.recording,
                track.artist,
                new Rating("track", track.filename, track.rating),
                { name: "playlist_add", action: e => tracklist.addTrack(track) },
            ],
            action: null,
        }
    }

    container.append(searchResults);

    container.initialize = (playlist) => {
        container.playlist = playlist;
        playlistName.initialize(playlist.name, "name", "Name");
        playlistName.toggleEdit(true);
        api.getPlaylistTracks(playlist.id, tracklist.setTracklist);
    }

    api.getSearchConfig("track", container.configureSearch);
    api.getPlaylist(playlistId, container.initialize);
    return container;
}

export { createPlaylistEditor };
