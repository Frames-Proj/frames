import * as React from 'react';
import VideoThumbnail, { VTArg } from "./VideoThumbnail";

export class VideosList extends React.Component<{}, {}> {

    render() {

        var numVideos = 20;

        // The idea is that we hardcode a bunch of root videos for various categories that
        // people can reply to if they want their videos to be easier to find.
        // A potential list of root video topics is below:
        //  "Politics", "Sports", "Frames Meta", "Memes", "Random", "Technology",
        //  "Music & Music Reviews", "Movies & Movie Reviews", "TV & TV Reviews",
        //  "Art", "Books & Book Reviews", "Science", "Travel"

        var videos: JSX.Element[] = [
            // sports
            <VideoThumbnail
                arg={new VTArg("AdafsAAAAAAAAAAAAAAg7pUk7oRUjt4UnccreklFfuYF3ZQzc2RcRLHmAwpieIAAAAAAAAAB9Q")} />,
            // art
            <VideoThumbnail
                arg={new VTArg("AAAAAAAAAAAAAAAgINq3PEnkFVN7CH0waEGtg+LP+h7Kup9poR6hueNrCQAAAAAAAAAB9Q")} />
        ];

        return (
            <div className='videoslist' style={{
                height: '100%',
                width: '100%',
                overflowY: 'scroll',
                padding: '20px 52px 0px 52px'
            }}>
                { videos }
            </div>
        );

    }

};
