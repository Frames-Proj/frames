/// <reference path="jquery.d.ts" />
/// <reference path="video.ts" />

$(document).ready(function() {

    const video : Video = {
        src: "videos/first.mov",
        info: {
            title: "Our First Video!",
            desc: "Here's our first video. You won't believe what happens!"
        },
        stats: {
            views: 20000,
            date: new Date(),
            likes: 50
        }
    };

    showVideo(video);

});

function showVideo(video : Video) : void {

    $("#player").attr("src", video.src);
    $("#title").text(video.info.title);
    $("#views").text(video.stats.views);
    $("#likes").text(video.stats.likes);
    $("#desc").text(video.info.desc);
    $("#uploaded").text(getDateString(video.stats.date));

}

function getDateString(date : Date) : string {

    const year : number = date.getFullYear();
    const day : number = date.getDate();

    const months : Array<string> = ['January', 'February', 'March', 'April', 'May', 
                  'June', 'July', 'August', 'September', 'October', 
                  'November', 'December'];
    const month : string = months[date.getMonth()];
    
    return month + " " + day + ", " + year;

}