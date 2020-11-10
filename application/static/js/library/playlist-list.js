import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";
import { createIcon } from "../shared/icons.js";
import { Rating } from "../api.js";

function createPlaylistList(api) { 

    let columns = [
        { display: "Name", className: "playlist-list-name", type: "text" },
        { display: "Tracks", className: "playlist-list-tracks", type: "text" },
        { display: "Rating", className: "playlist-list-rating", type: "rating" },
        { display: "", className: "playlist-list-view", type: "icon" },
        { display: "", className: "playlist-list-queue", type: "icon" },
        { display: "", className: "playlist-list-play", type: "icon" },
        { display: "", className: "playlist-list-delete", type: "icon" },
    ];

    let root = createListRoot(columns, "playlist-list-root", "playlist-list-row");

    let query = {
        match: [ ],
        exclude: [ ],
        sort: [ "name" ],
        order: "asc",
        unrated: false,
    }
    let search = createSearchBar(root, query, "playlist-list-search");
    root.configureSearch = (config) => search.initialize(config);

    search.addCheckbox("Unrated Only", "unrated", "list-search-unrated");

    root.append(search);

    root.updateResults = (query) => api.query("playlist", query, root.update);

    root.refresh = () => api.query("playlist", query, root.update);

    let deletePlaylist = (playlistId) => api.deletePlaylist(playlistId, root.refresh);

    let expandRow = (playlistId) => {
        return function(tracks) {
            let selected = document.getElementById(playlistId);
            selected.classList.add("list-row-highlighted");
            let next = selected.nextElementSibling;
            for (let track of tracks) {
                let data = {
                    values: [
                        track.title,
                        "",
                        new Rating("track", track.filename, track.rating),
                        null,
                        null,
                        null
                    ],
                    action: null
                }
                let row = root.createRow(data, true);
                row.classList.add("track-" + playlistId);
                row.classList.add("list-row-highlighted");
                (next != null) ? root.insertBefore(row, next) : root.append(row);
            }
        }
    }

    let collapseRow = (playlistId) => {
        let selected = document.getElementById(playlistId);
        selected.classList.remove("list-row-highlighted");
        let tracks = Array.from(document.getElementsByClassName("track-" + playlistId));
        for (let track of tracks)
            track.remove();
    }

    let playTracks = (entry) => {
        api.clearCurrentPlaylist();
        api.getPlaylistTracks(entry.id, api.queueTracks.bind(api));
        api.start();
    };

    root.getData = (entry) => {
        return {
            values: [
                entry.name,
                entry.length,
                new Rating("playlist", entry.id, entry.rating),
                { name: "create", action: e => window.location.href = "/playlist/" + entry.id },
                { name: "playlist_add", action: e => api.getPlaylistTracks(entry.id, api.queueTracks.bind(api)) },
                { name: "playlist_play", action: e => playTracks(entry) },
                { name: "clear", action: e => deletePlaylist(entry.id) },
            ],
            action: {
                selectId: entry.id,
                expand: e => api.getPlaylistTracks(entry.id, expandRow(entry.id)),
                collapse: e => collapseRow(entry.id)
            }
        }
    }

    root.addHeading();

    let newPlaylist = document.createElement("span");
    newPlaylist.classList.add("playlist-list-name");
    let text = document.createElement("span");
    text.classList.add("playlist-add-new");
    text.innerText = "New Playlist";
    newPlaylist.append(text);
    let newPlaylistIcon = createIcon("add", e => api.createPlaylist(r => window.location.href = "/playlist/" + r.id));
    newPlaylist.append(newPlaylistIcon);

    root.append(newPlaylist);

    document.title = "Browse Playlists";
    api.getSearchConfig("playlist", root.configureSearch);
    api.getAllPlaylists(root.addRows);
    return root;
}

export { createPlaylistList };
