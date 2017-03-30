import * as React from 'react';
import { Video } from './Video';

export class VideosList extends React.Component<{}, {}> {

    render() {

        var numVideos = 20;

        var videos = [];
        for (var i = 0; i < numVideos; ++i) {
            videos.push(
                <Video title={'Test Video ' + i}
                       user='Me'
                       length={45}
                       thumbnail='test.jpg'
                       key={i} />
            );
        }

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
