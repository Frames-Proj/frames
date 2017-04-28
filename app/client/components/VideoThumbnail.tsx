import * as React from "react";

import Video from "../ts/video-model";
import { ChasingArrowsLoadingImage } from "./Animations";
import { Maybe } from "../ts/maybe";
import { PropTypes } from "react";


export class VTArg {
    private kind: "xorName" | "rawPayload";
    constructor(private _d: string | VideoThumbnailPayload) {
        if (typeof _d === "string") this.kind = "xorName";
        else if (_d instanceof VideoThumbnailPayload) this.kind = "rawPayload";
        else throw new Error("Type error.");
    }
    public caseOf<T>(cases: { xorName: (xorName: string) => T,
                              rawPayload: (rawPayload: VideoThumbnailPayload) => T }): T {
        if (this.kind === "xorName") return cases.xorName(this._d as string);
        else if (this.kind === "rawPayload") return cases.rawPayload(this._d as VideoThumbnailPayload);
    }

}

interface VideoThumbnailProps {
    arg: VTArg;
}

interface VideoThumbnailState {
    /* resolvedVideo: Maybe<Video>;
     * resolvedVideoThumbnail: Maybe<string>;*/
    payload: Maybe<VideoThumbnailPayload>;
    videoIsBad: boolean;
}

// all the data a `VideoThumbnail` really needs to work.
class VideoThumbnailPayload {
    constructor(public title: string,
                public owner: string,
                public thumbnailFile: string,
                public xorName: string) {}
};

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

        this.state = {
            payload: Maybe.nothing<VideoThumbnailPayload>(),
            videoIsBad: false
        };

        props.arg.caseOf<Promise<void> | void>({
            xorName: n =>
                Video.readFromStringXorName(n, false)
                    .then((v: Video) => v.thumbnailFile.then((tf: string) =>
                        this.setState({ payload: Maybe.just(new VideoThumbnailPayload(
                        v.title, v.owner, tf, n))})))
                    .catch(_ => this.setState({ videoIsBad: true })),
            rawPayload: rp => this.setState({ payload: Maybe.just(rp) })
        });
    }

    private onClick(e): void {
        e.preventDefault();
        this.state.payload.caseOf({
            nothing: () => null, // if we have not loaded yet, the link should not be live
            just: p => this.context.router.history.push(`/watch/${p.xorName}`)
        });
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
            : this.state.payload.caseOf({
                nothing: () => <ChasingArrowsLoadingImage />,
                just: p => (
                    <div>
                        <a href="#" onClick={this.onClick.bind(this)} style={{
                            cursor: "pointer"
                        }}>
                            <div style={{
                                height: "100px",
                                width: "150px"
                            }}>
                                <img src={p.thumbnailFile} />
                            </div>
                            <span>
                                { p.title }
                            </span>
                        </a>
                        <div style={{
                            fontSize: "12px",
                            color: "gray"
                        }}>
                            { p.owner }
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

