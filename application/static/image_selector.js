const coverImage = document.getElementById("cover-image");
if (coverImage != null) {
    const selectImage = document.getElementById("select-image");
    selectImage.oninput = e => {
        let filename = e.target.value;
        coverImage.src = "/" + prefix + "/" + filename;
    }
}
