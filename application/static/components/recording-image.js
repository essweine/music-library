class RecordingImage extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-image";
        this.imagesAvailable;
    }

    initialize(directory) {

        let files = [ ];
        for (let attr of this.getAttributeNames())
            if (attr.startsWith("file"))
                files.push(this.getAttribute(attr));

        this.img = document.createElement("img");
        this.img.id ="artwork";

        this.select = document.createElement("select");
        this.select.oninput = e => this.img.src = "/file/"  + e.target.value;
        for (let file of files) {
            let option = document.createElement("option");
            option.value = file;
            option.innerText = file.replace(directory + "/", "");
            this.select.append(option);
        }

        if (files.length) {
            this.imagesAvailable = true;
            while (this.firstChild)
                this.firstChild.remove();
            this.img.src = "/file/" + files[0];
            this.append(this.img);
        }
    }

    add(directory, newFiles) {
        let files = [ ];
        for (let attr of this.getAttributeNames())
            if (attr.startsWith("file"))
                files.push(this.getAttribute(attr));

        for (let file of newFiles) {
            if (!files.includes(file)) {
                let option = document.createElement("option");
                option.value = file;
                option.innerText = file.replace(directory + "/", "");
                this.select.append(option);
            }
        }
    }

    update(context) {
        if (this.imagesAvailable) {
            if (context == "display")
                this.select.remove();
            else
                this.append(this.select);
        }
    }

    get() {
        if (this.imagesAvailable)
            return this.img.getAttribute("src").replace("/file/", "");
        else
            return null;
    }
}

export { RecordingImage };
