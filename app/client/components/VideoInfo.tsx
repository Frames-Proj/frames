import * as React from "react";

import { Video } from "../ts/video-model"

interface VideoInfoProps {
    video: Video;
}

export default class ReplyTree extends React.Component<VideoInfoProps, {}> {

    constructor(props: VideoInfoProps) {
        super(props);
    }

    public render() {

        return (
            <div style={{
                border: 'solid 1px #EAEAEA',
                padding: '20px'
            }}>
                <h1 style={{
                    marginTop: '0px'
                }}>
                    {this.props.video.title}
                </h1>
                <div>
                    <i className="fa fa-user-circle" aria-hidden="true" style={{
                        marginRight: '5px'
                    }}></i> {this.props.video.owner}
                </div>
                <div style={{
                    marginTop: '30px'
                }}>
                    {this.props.video.description}
                </div>
            </div>
        );

    }

}
