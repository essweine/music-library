import { Container, ContainerDefinition } from "../application.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Playlist} from "../shared/tracklist.js";
import { Icon, EditableInfo } from "../shared/widgets.js";
import { Rating } from "../api.js";

function PlaylistList() { 

    let columns = [
        { display: "Name", className: "playlist-list-name", type: "text" },
        { display: "Tracks", className: "playlist-list-tracks", type: "text" },
        { display: "Rating", className: "playlist-list-rating", type: "rating" },
        { display: "", className: "playlist-list-view", type: "icon" },
        { display: "", className: "playlist-list-queue", type: "icon" },
        { display: "", className: "playlist-list-play", type: "icon" },
        { display: "", className: "playlist-list-delete", type: "icon" },
    ];

    let playTracks = (entry) => {
        this.api.clearCurrentPlaylist();
        this.api.getPlaylistTracks(entry.id, this.api.queueTracks);
        this.api.start();
    };

    let deletePlaylist = (playlistId) => this.api.deletePlaylist(playlistId, this.refresh.bind(this, this.search.data));

    let getTrackData = (track) => {
        return {
            values: [
                track.title,
                "",
                new Rating("track", track.filename, track.rating),
                null,
                null,
                null,
                null,
            ],
            expand: null,
        }
    }

    let getPlaylistData = (entry) => {
        return {
            values: [
                entry.name,
                entry.length,
                new Rating("playlist", entry.id, entry.rating),
                { name: "create", action: e => window.location.href = "/playlist/" + entry.id },
                { name: "playlist_add", action: e => this.api.getPlaylistTracks(entry.id, this.api.queueTracks) },
                { name: "playlist_play", action: e => playTracks(entry) },
                { name: "clear", action: e => deletePlaylist(entry.id) },
            ],
            expand: { id: entry.id, getRows: this.api.getPlaylistTracks, createRow: getTrackData },
        }
    }

    ListRoot.call(this, columns, getPlaylistData, "playlist-list-root");

    this.refresh = function(query = this.search.data) { this.api.query(this.api.playlist, query, this.update.bind(this)); }
    this.search = new SearchBar("playlist-list-search", this.api.playlist, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.addHeading();

    let newPlaylist = document.createElement("span");
    newPlaylist.classList.add("playlist-list-name");
    let text = document.createElement("span");
    text.classList.add("playlist-add-new");
    text.innerText = "New Playlist";
    newPlaylist.append(text);
    let newPlaylistIcon = new Icon("add", e => this.api.createPlaylist(r => window.location.href = "/playlist/" + r.id));
    newPlaylist.append(newPlaylistIcon.root);

    this.root.append(newPlaylist);

    document.title = "Browse Playlists";
    //this.api.getAllPlaylists(this.addRows.bind(this));
}
PlaylistList.prototype = new Container;

function PlaylistEditor(playlistId) {

    let def = new ContainerDefinition("div", [ ], "playlist-container");
    Container.call(this, { }, def);

    let heading = document.createElement("div");
    heading.classList.add("section-heading");
    let playlistName = new EditableInfo([ "playlist-name" ]);
    heading.append(playlistName.root);
    this.root.append(heading);

    let reset = () => window.location.href = "/playlist";

    this.save = function() {
        playlistName.save()
        this.data.name = playlistName.data;
        let tracks = tracklist.getTracklist();
        this.data.filenames = tracks.map(track => track.filename);
        this.api.savePlaylist(this.data);
    }

    let saveIcon   = new Icon("save", e => this.save(), [ "playlist-save" ]);
    let cancelIcon = new Icon("clear", e => reset(), [ "playlist-cancel" ]);
    heading.append(saveIcon.root);
    heading.append(cancelIcon.root);

    let tracklist = new Playlist("playlist-tracks-editor");

    this.root.append(tracklist.root);

    let columns = [
        { display: "Title", className: "track-list-title", type: "text" },
        { display: "Recording", className: "track-list-recording", type: "text" },
        { display: "Artist", className: "track-list-artist", type: "text" },
        { display: "Rating", className: "track-list-rating", type: "rating" },
        { display: "", className: "track-list-add", type: "icon" },
    ];

    let getTrackData = (track) => {
        return {
            id: null,
            values: [
                track.title,
                track.recording,
                track.artist,
                new Rating("track", track.filename, track.rating),
                { name: "playlist_add", action: e => tracklist.addTrack(track) },
            ],
            expand: null,
        }
    }
    let searchResults = new ListRoot(columns, getTrackData, "track-search-results");
    this.root.append(searchResults.root);

    let cleared = function(query) {
        return query.match.length == 0 && query.exclude.length == 0 && query.official && query.nonofficial && !query.unrated;
    }

    searchResults.refresh = (query = search.currentQuery()) => {
        if (!cleared(query))
            this.api.query(this.api.track, query, searchResults.update.bind(searchResults));
        else
            searchResults.update([ ]);
    }

    let search = new SearchBar("track-list-search", this.api.track, searchResults.refresh);
    searchResults.root.append(search.root);

    this.initialize = (playlist) => {
        this.data = playlist;
        playlistName.configure(playlist.name, "name", "Name");
        playlistName.toggleEdit(true);
        this.api.getPlaylistTracks(playlist.id, tracklist.setTracklist.bind(tracklist));
        document.title = playlist.name;
    }

    this.api.getPlaylist(playlistId, this.initialize);
}
PlaylistEditor.prototype = new Container;

export { PlaylistList, PlaylistEditor };
