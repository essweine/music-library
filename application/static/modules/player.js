let Player = {

    url: "/api/player",

    startTask: { "name": "start" },
    stopTask: { "name": "stop" },

    playAll: function(recording) {
        let tracks = recording.tracks;
        let tasks = [ ];
        for (let track of tracks)
            tasks.unshift(this.addToPlaylistTask(track, 0));
        tasks.push(this.startTask);
        this.execute(tasks);
    },

    addToPlaylistTask: function(track, position = null) {
        return {
            "name": "add",
            "track": track,
            "position": position
        }
    },

    execute: function(tasks) {
        let data = { "tasks": tasks };
        let request = new XMLHttpRequest();
        request.open("POST", this.url);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }
}

export { Player }
