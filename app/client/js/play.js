$(document).ready(function() {

    video = {
        title: "Our First Video!",
        src: "videos/first.mov",
        views: 20000,
        date: new Date(),
        likes: 50,
        desc: "Here's our first video. You won't believe what happens!"
    }

    loadVideo(video);

});

function loadVideo(video) {

    $("#player").attr("src", video.src);
    $("#title").text(video.title);
    $("#views").text(video.views);
    $("#likes").text(video.likes);
    $("#desc").text(video.desc);

    $("#uploaded").text(function() {
        var date = video.date;
        var year = date.getFullYear();
        var day = date.getDate();
        var months = ['January', 'February', 'March', 'April', 'May', 
                      'June', 'July', 'August', 'September', 'October', 
                      'November', 'December'];
        var month = months[date.getMonth()];
        return month + " " + day + ", " + year;
    });

}