let NoOp = r => { };

class Api {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
    }

    get(path, callback = NoOp) { this.doRequest("GET", path, null, callback); }

    post(path, data, callback = NoOp) { this.doRequest("POST", path, data, callback); }

    put(path, data, callback = NoOp) { this.doRequest("PUT", path, data, callback); }

    doRequest(method, path, data, callback) {
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.parseResponse(e, callback));
        request.open(method, this.base + path);
        if (data != null) {
            request.setRequestHeader("Content-Type", "application/json");
            request.send(JSON.stringify(data));
        } else {
            request.send();
        }
    }

    parseResponse(e, callback) {
        let response = (e.target.response) ? JSON.parse(e.target.response) : e.target.response;
        if (e.target.status < 400)
            callback(response);
        else
            this.errorHandler(response.messages);
    }
}

class Recording extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/recording";
    }

    listAll(callback) { this.get("", callback); }

    getRecording(recordingId, callback) { this.get("/" + recordingId, callback); }

    addToLibrary(data) { 
        let callback = response => window.location = "/recording/" + data.id;
        this.post("/" + data.id, data, callback);
    }

    saveRecording(data) { this.put("/" + data.id, data, NoOp); }

    updateRating(recordingId, data) { this.put("/" + recordingId + "/rating", data); }
}

class Importer extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/importer";
    }

    listAll(callback) { this.get("", callback); }

    getDirectoryListing(directory, callback) { this.get("/" + directory, callback); }
}

class Player extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/player";
        this.wsUrl = "/api/player/notifications";

        this.stopTask = { "name": "stop" };
        this.startTask = { "name": "start" };
        this.pauseTask = { "name": "pause" };
    }

    createTask(name, filename, position) {
        return {
            name: name,
            filename: filename,
            position: position
        }
    }

    start() { this.sendTasks([ this.startTask ]); }

    stop() { this.sendTasks([ this.stopTask ]); }

    pause() { this.sendTasks([ this.pauseTask ]); }

    playRecording(recording) { this.playAll(recording.tracks); }

    playAll(tracks) {
        let tasks = [ ];
        for (let track of tracks)
            tasks.unshift(this.createTask("add", track.filename, 0));
        tasks.push(this.startTask);
        this.sendTasks(tasks);
    }

    play(track) { 
        this.sendTasks([ 
            this.createTask("add", track.filename, 0),
            this.stopTask,
            this.startTask
        ]);
    }

    queueRecording(recording) { this.queueAll(recording.tracks); }

    queueAll(tracks) {
        let tasks = [ ];
        for (let track of tracks)
            tasks.push(this.createTask("add", track.filename));
        this.sendTasks(tasks);
    }

    queue(track) { this.sendTasks([ this.createTask("add", track.filename) ]); }

    clearAll(tracks) {
        let tasks = [ ];
        for (let i = 0; i < tracks.length; i++)
            tasks.push(this.createTask("remove", track.filename, 0));
        this.sendTasks(tasks);
    }

    getCurrentState(callback) { this.get("", callback); }

    sendTasks(tasks) { this.post("", { "tasks": tasks }, NoOp); }
}

class Search extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/search";
    }

    searchRecordings(query, callback) { this.post("/recording", query, callback); }
}

class History extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/history";
    }

    getRecentTracks(period, callback) {
        let end = new Date(Date.now());
        let start = new Date(end - (period * 1000));
        let query = {
            start: start.toISOString(),
            end: end.toISOString()
        }
        this.post("", query, callback); 
    }
}

export { Recording, Importer, Player, Search, History };
