$(document).ready(function() {

    $("#submit").click(function() {
        var video = getVideo();
        console.log(video);
    });

    $("#video-input").change(setUploadFilename);

});

function extractFilename(filepath) {
    var re = /C:\\fakepath\\(.+)/
    var filename = filepath.match(re)[1];
    return filename;
}

function getVideo() {

    var video = {
        title: $("#title").val(),
        src: extractFilename($("#video-input").val()),
        views: 0,
        date: new Date(),
        likes: 0,
        desc: $("#desc").val()
    }

    return video;

}

function setUploadFilename() {

    var filename = extractFilename($("#video-input").val());
    console.log(filename);
    var icon = $('<i />').attr("class", "fa fa-video-camera");
    
    $("#video-label").empty();
    $("#video-label").append(icon).append(filename);

}