class Api {
    constructor() { }

    get(callback = r => { }) { this.doRequest("GET", "", null, callback); }

    post(data, callback = r => { }) { this.doRequest("POST", "", data, callback); }

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
        callback(response);
    }
}

class Recording extends Api {

    constructor(recordingId) {
        super();
        this.id = recordingId;
        this.base = "/api/recording/" + recordingId;
    }

    getDirectoryListing(callback = r => { }) { this.doRequest("GET", "/entry", null, callback); }

    getFromNotes(callback = r => { }) { this.doRequest("GET", "/notes", null, callback); }

    addToLibrary(data) { 
        let callback = response => window.location = "/recording/" + this.id;
        this.post(data, callback);
    }

    saveRecording(data, callback = r => { }) { this.doRequest("PUT", "", data, callback); }

    updateRating(data, callback = r => { }) { this.doRequest("PUT", "/rating", data, callback); }

}

class Importer extends Api {

    constructor(directoryId) {
        super();
        this.id = directoryId;
        this.base = "/api/importer/" + directoryId;
    }

    getRecording(source, callback) {
        let path = "?as=recording";
        if (source != null)
            path += "&source=" + encodeURIComponent(source);
        this.doRequest("GET", path, null, callback);
    }
}

export { Recording, Importer };
