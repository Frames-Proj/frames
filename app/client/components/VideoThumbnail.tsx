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
    resolvedVideoThumbnail: Maybe<string>;
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
             .then((v: Video) => {
                 this.setState({ resolvedVideo: Maybe.just(v) });
                 v.thumbnailFile.then((tf: string) =>
                     this.setState({ resolvedVideoThumbnail: Maybe.just(tf) }));
             })
             .catch(_ => this.setState({ videoIsBad: true }));

        this.state = {
            resolvedVideo: Maybe.nothing<Video>(),
            resolvedVideoThumbnail: Maybe.nothing<string>(),
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
            null
            : this.state.resolvedVideo.caseOf({
                nothing: () => <ChasingArrowsLoadingImage />,
                just: v => (
                    <div className="video-thumbnail" style={{
                        display: 'inline-block',
                        marginRight: '50px'
                    }}>
                        <a href="#" onClick={this.onClick.bind(this)} style={{
                            cursor: "pointer"
                        }}>
                            <div style={{
                                height: "100px",
                                width: "100%",
                                overflow: 'hidden'
                            }}>
                                {this.state.resolvedVideoThumbnail.caseOf({
                                    nothing: () => <ChasingArrowsLoadingImage />,
                                    just: t => <img src={t} style={{
                                        height: '100px',
                                        width: 'auto'
                                    }}/>
                                })}
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
            <div style={{
                display: 'inline-block'
            }}>
                {content}
            </div>
        );

    }

};

