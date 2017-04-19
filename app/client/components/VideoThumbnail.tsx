import * as React from "react";

import Video from "../ts/video-model";
import { ChasingArrowsLoadingImage } from "./Animations";
import { Maybe } from "../ts/maybe";
import { PropTypes } from "react";

interface VideoThumbnailProps {
    xorName: string;
}

interface VideoThumbnailState {
    resolvedVideo: Maybe<Video>;
    videoIsBad: boolean;
}

export default class VideoThumbnail extends React.Component<VideoThumbnailProps, VideoThumbnailState> {

    // ask for the react context
    static contextTypes = {
        router: PropTypes.shape({
            history: PropTypes.shape({
                push: PropTypes.func.isRequired,
            }).isRequired,
            staticContext: PropTypes.object
        }).isRequired
    }

    constructor(props: VideoThumbnailProps) {
        super(props);

        Video.readFromStringXorName(props.xorName, false)
             .then(v => this.setState({ resolvedVideo: Maybe.just(v) }))
             .catch(_ => this.setState({ videoIsBad: true }));

        this.state = {
            resolvedVideo: Maybe.nothing<Video>(),
            videoIsBad: false
        };
    }

    private onClick(e): void {
        e.preventDefault();
        this.context.router.history.push(`/watch/${this.props.xorName}`);
    }

    render() {
        const content: JSX.Element =
            this.state.videoIsBad ?
            <span style={{
                color: "#e80910",
                fontSize: "160px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "0px 20px 0px 20px"
            }}> X </span>
            : this.state.resolvedVideo.caseOf({
                nothing: () => <ChasingArrowsLoadingImage />,
                just: v => (
                    <div>
                        <a href="#" onClick={this.onClick.bind(this)} style={{
                            cursor: "pointer"
                        }}>
                            <div style={{
                                height: "100px",
                                width: "150px",
                                background: "black"
                            }}>
                            </div>
                            <span>
                                { v.title }
                            </span>
                        </a>
                        <div style={{
                            fontSize: "12px",
                            color: "gray"
                        }}>
                            { v.owner }
                        </div>
                    </div>)
            });

        return (
            <div className="video-thumbnail">
                {content}
            </div>
        );

    }

};

