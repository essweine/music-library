let NoOp = r => { };

function Task(name, props = { }) {
    this.name = name;
    Object.keys(props).map(prop => this[prop] = props[prop]);
}

function Rating(itemType, itemId, value) {
    this.item_type = itemType;
    this.item_id   = itemId;
    this.value     = value;
}

function Api(errorHandler) {

    this.errorHandler = errorHandler;

    this.importer  = "/api/importer";
    this.recording = "/api/recording";
    this.playlist  = "/api/playlist";
    this.station   = "/api/station";
    this.rating    = "/api/rating";
    this.search    = "/api/search";
    this.history   = "/api/history";
    this.player    = "/api/player";

    this.playerNotification = "/api/player/notifications";
    this.logNotification    = "/api/log/notifications";

    /* --- Import requests --- */

    this.getAllDirectories = (callback) => { this.get(this.importer, callback); }

    this.getDirectoryListing = (directory, callback) => { this.get(this.importer + "/" + directory, callback); }

    /* --- Library requests --- */

    this.getAllRecordings = (callback) => { this.get(this.recording, callback); }

    this.getRecording = (recordingId, callback) => { this.get(this.recording + "/" + recordingId, callback); }

    this.addToLibrary = (data) => { 
        let callback = response => window.location = "/recording/" + data.id;
        this.post(this.recording + "/" + data.id, data, callback);
    }

    this.saveRecording = (data) => { this.put(this.recording + "/" + data.id, data, NoOp); }

    this.getAllPlaylists = (callback) => { this.get(this.playlist, callback); }

    this.createPlaylist = (callback) => { this.post(this.playlist, null, callback); }

    this.getPlaylist = (playlistId, callback) => { this.get(this.playlist + "/" + playlistId, callback); }

    this.getPlaylistTracks = (playlistId, callback) => { this.get(this.playlist + "/tracks/" + playlistId, callback); }

    this.savePlaylist = (data) => { this.put(this.playlist + "/" + data.id, data); }

    this.deletePlaylist = (playlistId, callback) => { this.httpDelete(this.playlist + "/" + playlistId, callback); }

    this.getAllStations = (callback) => { this.get(this.station, callback); }

    this.saveStation = (data, callback) => { this.put(this.station + "/" + data.id, data, callback); }

    this.addStation = (data, callback) => { this.post(this.station + "/" + data.name, data, callback); }

    this.deleteStation = (station_id, callback) => { this.httpDelete(this.station + "/" + station_id, callback); }

    this.updateRating = (rating) => { this.post(this.rating, rating, NoOp); }

    this.getSearchConfig = (itemType, callback) => { this.get(this.search + "/" + itemType, callback); }

    this.query = (itemType, query, callback) => { this.post(this.search + "/" + itemType, query, callback); }

    this.getRecentTracks = (period, callback) => {
        let end = new Date(Date.now());
        let start = new Date(end - (period * 1000));
        let query = {
            start: start.toISOString(),
            end: end.toISOString()
        }
        this.post(this.history, query, callback); 
    }

    /* -- Player requests --- */

    this.start = () => { this.sendTasks([ new Task("start") ]); }

    this.stop = () => { this.sendTasks([ new Task("stop") ]); }

    this.pause = () => { this.sendTasks([ new Task("pause") ]); }

    this.clearCurrentPlaylist = () => { this.sendTasks([ new Task("clear") ]); }

    this.repeatCurrentPlaylist = () => { this.sendTasks([ new Task("repeat") ]); }

    this.shuffleCurrentPlaylist = () => { this.sendTasks([ new Task("shuffle") ]); }

    this.queue = (track) => { this.sendTasks([ new Task("add", { filename: track.filename, position: null }) ]); }

    this.queueRecording = (recording) => { this.queueTracks(recording.tracks); }

    this.queueTracks = (tracks) => {
        let tasks = tracks.map(track => new Task("add", { filename: track.filename, position: null }));
        this.sendTasks(tasks);
    }

    this.streamUrl = (url) => { this.sendTasks([ new Task("stream", { url: url }) ]); }

    this.getCurrentState = (callback) => { this.get(this.player, callback); }

    this.sendTasks = (tasks) => { this.post(this.player, { "tasks": tasks }, NoOp); }

    /* --- Generic http requests and helpers --- */

    this.get = (path, callback = NoOp) => { this.doRequest("GET", path, null, callback); }

    this.post = (path, data, callback = NoOp) => { this.doRequest("POST", path, data, callback); }

    this.put = (path, data, callback = NoOp) => { this.doRequest("PUT", path, data, callback); }

    this.httpDelete = (path, callback = NoOp) => { this.doRequest("DELETE", path, null, callback); }

    this.doRequest = (method, path, data, callback) => {
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.parseResponse(e, callback));
        request.open(method, path);
        if (data != null) {
            request.setRequestHeader("Content-Type", "application/json");
            request.send(JSON.stringify(data));
        } else {
            request.send();
        }
    }

    this.parseResponse = (e, callback) => {
        let response = (e.target.response) ? JSON.parse(e.target.response) : e.target.response;
        if (e.target.status < 400)
            callback(response);
        else
            this.errorHandler(response.messages);
    }
}

export { Api, Task, Rating };

