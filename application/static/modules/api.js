let NoOp = r => { };

class Api {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
    }

    get(path, callback = NoOp) { this.doRequest("GET", path, null, callback); }

    post(path, data, callback = NoOp) { this.doRequest("POST", path, data, callback); }

    put(path, data, callback = NoOp) { this.doRequest("PUT", path, data, callback); }

    httpDelete(path, callback = NoOp) { this.doRequest("DELETE", path, null, callback); }

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
        this.clearTask = { "name": "clear" };
        this.shuffleTask = { "name": "shuffle" };
        this.repeatTask = { "name": "repeat" };
    }

    moveTask(original, destination) {
        return {
            name: "move",
            original: original,
            destination: destination
        }
    }

    addTask(filename, position = null) {
        return {
            name: "add",
            filename: filename,
            position: position
        }
    }

    removeTask(position) {
        return { name: "remove", position: position }
    }

    skipTask(offset) {
        return { name: "skip", offset: offset }
    }

    start() { this.sendTasks([ this.startTask ]); }

    stop() { this.sendTasks([ this.stopTask ]); }

    pause() { this.sendTasks([ this.pauseTask ]); }

    clearPlaylist() { this.sendTasks([ this.clearTask ]); }

    repeat() { this.sendTasks([ this.repeatTask ]); }

    shuffle() { this.sendTasks([ this.shuffleTask ]); }

    queue(track) { this.sendTasks([ this.addTask(track.filename) ]); }

    queueRecording(recording) { this.queueAll(recording.tracks); }

    queueAll(tracks) {
        let tasks = [ ];
        for (let track of tracks)
            tasks.push(this.addTask(track.filename));
        this.sendTasks(tasks);
    }

    removeAll(tracks) {
        let tasks = [ ];
        for (let i = 0; i < tracks.length; i++)
            tasks.push(this.removeTask(0));
        this.sendTasks(tasks);
    }

    streamUrl(url) { this.sendTasks([ { name: "stream", url: url } ]); }

    getCurrentState(callback) { this.get("", callback); }

    sendTasks(tasks) { this.post("", { "tasks": tasks }, NoOp); }
}

class Rating extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/rating";
    }

    update(rating) { this.post("", rating, NoOp); }
}

class Search extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/search";
    }

    searchRecordings(query, callback) { this.post("/recording", query, callback); }

    searchStations(query, callback) { this.post("/station", query, callback); }
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

class Station extends Api {

    constructor(errorHandler) {
        super(errorHandler);
        this.base = "/api/station";
    }

    listAll(callback) { this.get("", callback); }

    saveStation(data, name, callback) { this.put("/" + name, data, callback); }

    addStation(data, callback) { this.post("/" + data.name, data, callback); }

    deleteStation(name, callback) { this.httpDelete("/" + name, callback); }
}

export { Recording, Importer, Player, Rating, Search, History, Station };
