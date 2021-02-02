import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Playlist} from "../shared/tracklist.js";
import { Icon, EditableInfo } from "../shared/widgets.js";

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
        this.clearCurrentPlaylist();
        this.getItem(this.playlistApi, entry.id, this.queueTracks);
        this.start();
    };

    let deletePlaylist = (playlistId) => this.deleteItem(this.playlistApi, playlistId, this.refresh.bind(this, this.search.data));

    let getTrackData = (track) => {
        return {
            values: [
                track.title,
                "",
                Container.createRating("track", track.filename, track.rating),
                null,
                null,
                null,
                null,
            ],
            rowId: null,
            expand: null,
        }
    }

    let getPlaylistData = (entry) => {
        return {
            values: [
                entry.name,
                entry.length,
                Container.createRating("playlist", entry.id, entry.rating),
                { name: "create", action: e => window.location.href = "/playlist/" + entry.id },
                { name: "playlist_add", action: e => this.getPlaylistTracks(entry.id, this.queueTracks) },
                { name: "playlist_play", action: e => playTracks(entry) },
                { name: "clear", action: e => deletePlaylist(entry.id) },
            ],
            rowId: entry.id,
            expand: { getRows: this.getPlaylistTracks, createRow: getTrackData },
        }
    }

    ListRoot.call(this, columns, getPlaylistData, "playlist-list-root");

    this.refresh = function(query = this.search.data) { this.query(this.playlistApi, query, this.update.bind(this)); }
    this.search = new SearchBar("playlist-list-search", this.playlistApi, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.addHeading();

    let newPlaylist = this.createElement("span", null, [ "playlist-list-name" ]);
    let text = this.createElement("span", null, [ "playlist-add-new" ]);
    text.innerText = "New Playlist";
    newPlaylist.append(text);

    let callback = resp => window.location.href = "/playlist/" + resp.id;
    let newPlaylistIcon = new Icon("add", e => this.createItem(this.playlistApi, null, callback));
    newPlaylist.append(newPlaylistIcon.root);

    this.root.append(newPlaylist);

    document.title = "Browse Playlists";
}
PlaylistList.prototype = new ListRoot;

function PlaylistEditor(playlistId) {

    Container.init.call(this, "div", "playlist-container");

    let heading = this.createElement("div", null, [ "section-heading" ]);
    let playlistName = new EditableInfo([ "playlist-name" ]);
    heading.append(playlistName.root);
    this.root.append(heading);

    let reset = () => window.location.href = "/playlist";

    this.save = function() {
        playlistName.save()
        this.data.name = playlistName.data;
        let tracks = tracklist.getTracklist();
        this.data.filenames = tracks.map(track => track.filename);
        this.saveItem(this.playlistApi, this.data);
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
                Container.createRating("track", track.filename, track.rating),
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
            this.query(this.trackApi, query, searchResults.update.bind(searchResults));
        else
            searchResults.update([ ]);
    }

    let search = new SearchBar("track-list-search", this.trackApi, searchResults.refresh);
    searchResults.root.append(search.root);

    this.initialize = (playlist) => {
        this.data = playlist;
        playlistName.configure(playlist.name, "name", "Name");
        playlistName.toggleEdit(true);
        this.getPlaylistTracks(playlist.id, tracklist.setTracklist.bind(tracklist));
        document.title = playlist.name;
    }

    this.getItem(this.playlistApi, playlistId, this.initialize);
}
PlaylistEditor.prototype = Container;

export { PlaylistList, PlaylistEditor };
