import { createListRoot, createListRow } from "../shared/item-list.js";
import { createSearchBar } from "../shared/item-list-search.js";
import { createIcon } from "../shared/icons.js";

function createPlaylistList(app) { 

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

    root.updateResults = (query) => app.searchApi.query("playlist", query, root.update);

    root.refresh = () => app.searchApi.query("playlist", query, root.update);

    let deletePlaylist = (playlistId) => app.playlistApi.deletePlaylist(playlistId, root.refresh);

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
                        { itemType: "track", itemId: track.filename, rating: track.rating },
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
        app.playerApi.clearPlaylist();
        app.playlistApi.getTracks(entry.id, app.playerApi.queueAll.bind(app.playerApi));
        app.playerApi.start();
    };

    root.getData = (entry) => {
        return {
            values: [
                entry.name,
                entry.length,
                { itemType: "playlist", itemId: entry.id, rating: entry.rating },
                { name: "create", action: e => window.location.href = "/playlist/" + entry.id },
                { name: "playlist_add", action: e => app.playlistApi.getTracks(entry.id, app.playerApi.queueAll.bind(app.playerApi)) },
                { name: "playlist_play", action: e => playTracks(entry) },
                { name: "clear", action: e => deletePlaylist(entry.id) },
            ],
            action: {
                selectId: entry.id,
                expand: e => app.playlistApi.getTracks(entry.id, expandRow(entry.id)),
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
    let newPlaylistIcon = createIcon("add", e => app.playlistApi.createPlaylist(r => window.location.href = "/playlist/" + r.id));
    newPlaylist.append(newPlaylistIcon);

    root.append(newPlaylist);

    document.title = "Browse Playlists";
    app.container = root;
}

export { createPlaylistList };
