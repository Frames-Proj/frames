import * as React from "react";
import { Jumbotron, Navbar, Nav, NavItem } from "react-bootstrap";

import { VideosNav } from "./Navbar";
import { VideosList } from "./VideosList";
import { Upload } from "./Upload";
import Video from "../ts/video-model"
import { SerializedDataID, withDropP } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";

import { safeClient } from "../ts/util";
import { Maybe } from "../ts/maybe";
const sc = safeClient;


interface VideoPlayerProps {
    video: Promise<Video>;
}

interface ResolvedVideo {
    video: Video;
    videoFile: string;
}

interface VideoPlayerState {
    reply: boolean;
    resolvedVideo: Maybe<ResolvedVideo>;
}
class VideoPlayer extends React.Component<VideoPlayerProps, VideoPlayerState> {
    constructor(props: VideoPlayerProps) {
        super(props);
        this.state = {
            reply: false,
            resolvedVideo: Maybe.nothing<ResolvedVideo>()
        };
        // wait for the download to finish
        this.resolveVideo(props);
        this.setReply.bind(this);
        this.render.bind(this);
    }

    private resolveVideo(props: VideoPlayerProps): void {
        props.video.then(v =>
            v.file.then( f => this.setState({ resolvedVideo: Maybe.just({
                videoFile: f,
                video: v
            })}))
        );
    }

    private setReply() {
        this.setState({ reply: true });
    }

    componentWillReceiveProps(nextProps: VideoPlayerProps): void {
        this.resolveVideo(nextProps);
    }

    public render() {
        function mkActualPlayer(rv: ResolvedVideo): JSX.Element {
            return (<div>
                <h1>{rv.video.title}</h1>
                {/* TODO: get the correct mime type from the video model */}
                <video width={600} controls src={`file://${rv.videoFile}`} type={"video/mp4"} />
                <p>{rv.video.description}</p>
                <button onClick={() => this.setState({ reply: true })}>reply</button>
                {rv.video.parentVideoXorName.caseOf({
                    nothing: () => <p>This is a root video</p>,
                    just: n => <p>{`parent= frames://${n}`}</p>
                })}
            </div>);
        }

        if (this.state.reply) {
            return <Upload replyVideo={this.props.video} />
        } else {
            return this.state.resolvedVideo.caseOf({
                nothing: () => <ChasingArrowsLoadingImage />,
                just: mkActualPlayer.bind(this)
            });
        }
    }
}

interface WatchProps {
    history: any;
    match: {
        path: string;
        url: string;
        params: {
            xorName: string;
        }
    }
}

interface WatchState {
    badXorName: boolean;
    video: Promise<Video>;
}

export class Watch extends React.Component<WatchProps, WatchState> {

    constructor(props: WatchProps) {
        super(props);

        this.state = {
            video: this.mkVideo(props).catch(this.handleVideoError.bind(this)),
            badXorName: false,
        };
    }

    private async mkVideo(props): Promise<Video> {
        const ptr: SerializedDataID = Buffer.from(props.match.params.xorName, "base64");
        return withDropP(await sc.dataID.deserialise(ptr), xorName => Video.read(xorName));
    }

    componentWillReceiveProps(nextProps: WatchProps) {
        this.state.video.then( v => v.drop() );
        this.setState({ video: this.mkVideo(nextProps).catch(this.handleVideoError) });
    }

    private handleVideoError(err) {
        this.setState({ badXorName: true });
    }

    // destructor
    private async componentWillUnmount() {
        await this.state.video.then(v => v.drop());
    }
    render() {
        const body =
            this.state.badXorName ?
                <Jumbotron style={{ width: '100%', padding: '50px' }}>
                    <h1>Bad Frames URL!</h1>
                    <p>It looks like the video you want is not on the SafeNET</p>
                </Jumbotron>
            : <VideoPlayer video={this.state.video} />
        return (
            <div style={{
                height: "100%",
                width: "100%",
                alignItems: "center",
                display: "flex",
                justifyContent: "center"
            }}>
                {body}
            </div>
        );
    }

};

