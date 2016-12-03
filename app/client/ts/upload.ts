/// <reference path="jquery.d.ts" />
/// <reference path="video.ts" />

$(document).ready(function() {

    $("#submit").click(uploadVideo);
    $("#video-input").change(setUploadFilename);

});

function uploadVideo() : void {
    const video : Video = getVideo();
}

function getVideo() : Video {

    const video : Video = {
        src: extractFilename($("#video-input").val()),
        info: {
            title: $("#title").val(),
            desc: $("#desc").val()
        }, 
        stats: {
            views: 0,
            date: new Date(),
            likes: 0
        }
    };

    return video;

}

function extractFilename(filepath : string) : string {
    const re : RegExp = /C:\\fakepath\\(.+)/
    const filename : string = filepath.match(re)[1];
    return filename;
}

function setUploadFilename() : void {

    const filename : string = extractFilename($("#video-input").val());
    const icon : JQuery = $('<i />').attr("class", "fa fa-video-camera");
    
    $("#video-label").empty();
    $("#video-label").append(icon).append(filename);

}