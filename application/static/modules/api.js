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

    constructor() {
        super();
        this.base = "/api/recording";
    }

    listAll(callback) { this.doRequest("GET", "", null, callback); }

    getRecording(recordingId, callback) { this.doRequest("GET", "/" + recordingId, null, callback); }

    getDirectoryListing(callback = r => { }) { this.doRequest("GET", "/entry", null, callback); }

    getFromNotes(callback = r => { }) { this.doRequest("GET", "/notes", null, callback); }

    addToLibrary(data) { 
        let callback = response => window.location = "/recording/" + data.id;
        this.doRequest("POST", "/" + data.id, data, callback);
    }

    saveRecording(data) { this.doRequest("PUT", "/" + data.id, data, r => { }); }

    updateRating(recordingId, data, callback = r => { }) { this.doRequest("PUT", "/" + recordingId + "/rating", data, callback); }

}

class Importer extends Api {

    constructor() {
        super();
        this.base = "/api/importer";
    }

    listAll(callback) { this.doRequest("GET", "", null, callback); }

    getDirectoryListing(directory, callback) { this.doRequest("GET", "/" + directory, null, callback); }
}

export { Recording, Importer };
