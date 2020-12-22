const NoOp = r => { };

const Container = {

    init: function(type, id = null, classes = [ ]) {
        this.root = this.createElement(type, id, classes);
        this.data = null;
    },

    /* --- General utilities --- */

    createElement: function(type, id = null, classes = [ ]) {
        let item = document.createElement(type);
        classes.map(name => item.classList.add(name));
        if (id != null)
            item.id = id;
        return item;
    },

    getNotificationService: function(path) {
        let wsUrl = "ws://" + location.host + path;
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => { });
        return ws;
    },

    /* --- Api paths --- */

    importerApi:   "/api/importer",
    recordingApi:  "/api/recording",
    trackApi:      "/api/track",
    playlistApi:   "/api/playlist",
    stationApi:    "/api/station",
    ratingApi:     "/api/rating",
    suggestionApi: "/api/suggestion",
    historyApi:    "/api/history",
    playerApi:     "/api/player",

    playerNotification: "/api/player/notifications",
    logNotification:    "/api/log/notifications",

    /* --- Api objects --- */

    createTask: (name, props = { }) => {
        props.name = name;
        return props;
    },

    createRating: (itemType, itemId, value) => {
        return {
            item_type: itemType,
            item_id: itemId,
            value: value,
        };
    },

    /* --- Import requests --- */

    getAllDirectories: function(callback) { this.get(this.importerApi, callback); },

    refreshDirectories: function(callback) { this.post(this.importerApi, null, callback); },

    /* --- Library requests --- */

    getItem:    function(base, itemId, callback) { this.get(base + "/" + itemId, callback); },
    saveItem:   function(base, data) { this.put(base + "/" + data.id, data); },
    createItem: function(base, data, callback) { this.post(base, data, callback); },
    deleteItem: function(base, itemId, callback) { this.delete(base + "/" + itemId, callback); },

    getRecordingTracks: function(recordingId, callback) { this.get(this.recordingApi + "/" + recordingId + "/tracks", callback); },

    getPlaylistTracks: function(playlistId, callback) { this.get(this.playlistApi + "/" + playlistId + "/tracks", callback); },

    updateRating: function(rating) { this.post(this.ratingApi, rating, NoOp); },

    getSearchConfig: function(base, callback) { this.get(base + "/search", callback); },

    query: function(base, query, callback) { this.post(base + "/search", query, callback); },

    aggregate: function(base, aggType, query, callback) { this.post(base + "/aggregate/" + aggType, query, callback); },

    getRecentTracks: function(period, callback) {
        let end = new Date(Date.now());
        let start = new Date(end - (period * 1000));
        let query = {
            start: start.toISOString(),
            end: end.toISOString()
        }
        this.post(this.historyApi + "/recent", query, callback); 
    },

    getFrequentTracks: function(numTracks, callback) {
        let query = { num_tracks: numTracks };
        this.post(this.historyApi + "/frequent", query, callback);
    },

    getTrackHistory: function(filename, callback) {
        let query = { "filename": filename };
        this.post(this.historyApi + "/track", query, callback);
    },

    /* --- Suggestions --- */

    onThisDate: function(official, callback) { this.get(this.suggestionApi + "/on-this-date?official=" + official, callback); },

    unlistened: function(official, callback) { this.get(this.suggestionApi + "/unlistened?official=" + official, callback); },

    randomRecordings: function(official, callback) { this.get(this.suggestionApi + "/random?official=" + official, callback); },

    /* -- Player requests --- */

    start: function() { this.sendTasks([ this.createTask("start") ]); },

    stop: function() { this.sendTasks([ this.createTask("stop") ]); },

    pause: function() { this.sendTasks([ this.createTask("pause") ]); },

    clearCurrentPlaylist: function() { this.sendTasks([ this.createTask("clear") ]); },

    repeatCurrentPlaylist: function() { this.sendTasks([ this.createTask("repeat") ]); },

    shuffleCurrentPlaylist: function() { this.sendTasks([ this.createTask("shuffle") ]); },

    queue: function(track) { this.sendTasks([ this.createTask("add", { filename: track.filename, position: null }) ]); },

    queueRecording: function(recording) { this.queueTracks(recording.tracks); },

    queueTracks: function(tracks) {
        let tasks = tracks.map(track => this.createTask("add", { filename: track.filename, position: null }));
        this.sendTasks(tasks);
    },

    streamUrl: function(url) { this.sendTasks([ this.createTask("stream", { url: url }) ]); },

    getCurrentState: function(callback) { this.get(this.playerApi, callback); },

    sendTasks: function(tasks) { this.post(this.playerApi, { "tasks": tasks }, NoOp); },

    /* --- Generic http requests and helpers --- */

    get:    function(path, callback = NoOp) { this.doRequest("GET", path, null, callback); },
    post:   function(path, data, callback = NoOp) { this.doRequest("POST", path, data, callback); },
    put:    function(path, data, callback = NoOp) { this.doRequest("PUT", path, data, callback); },
    delete: function(path, callback = NoOp) { this.doRequest("DELETE", path, null, callback); },

    doRequest: function(method, path, data, callback) {
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.parseResponse(e, callback));
        request.open(method, path);
        if (data != null) {
            request.setRequestHeader("Content-Type", "application/json");
            request.send(JSON.stringify(data));
        } else {
            request.send();
        }
    },

    parseResponse: function(e, callback) {
        let response = (e.target.response) ? JSON.parse(e.target.response) : e.target.response;
        if (e.target.status < 400)
            callback(response);
        else
            this.errorHandler(response.messages);
    },
};

export { Container };
