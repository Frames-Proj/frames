import * as React from 'react';
import { Video } from './Video';

export class VideosList extends React.Component<{}, {}> {

    render() {

        var numVideos = 20;

        var videos = [
            <Video title={"Politics"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={1} />,
            <Video title={"Sports"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={2} />,
            <Video title={"Frames Meta"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={3} />,
            <Video title={"Memes"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={4} />,
            <Video title={"Random"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={5} />,
            <Video title={"Technology"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={6} />,
            <Video title={"Music & Music Reviews"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={7} />,
            <Video title={"Movies & Movie Reviews"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={8} />,
            <Video title={"TV & TV Reviews"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={9} />,
            <Video title={"Art"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={10} />,
            <Video title={"Books & Book Reviews"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={11} />,
            <Video title={"Science"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={12} />,
            <Video title={"Travel"}
                    user="Frames Staff"
                    length={45}
                    thumbnail='test.jpg'
                    key={13} />
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
