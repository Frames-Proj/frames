import * as React from "react";
import { Jumbotron, Navbar, Nav, NavItem } from "react-bootstrap";

import { Upload } from "./Upload";
import Video from "../ts/video-model"
import { SerializedDataID, withDropP } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";
import { PropTypes } from "react";

import { safeClient, WATCH_URL_RE } from "../ts/util";
import { Maybe } from "../ts/maybe";
const sc = safeClient;


interface VideoPlayerProps {
    video: Promise<Video>;
    redirect: (route: string) => void;
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
        this.render.bind(this);
    }

    private resolveVideo(props: VideoPlayerProps): void {
        props.video.then((v: Video) =>
            v.file
             .valueOr(Promise.reject<string>(
                 "Watch.tsx:VideoPlayer:resolveVideo shallow video. Impossible."))
             .then(f => this.setState({ resolvedVideo: Maybe.just({
                 videoFile: f,
                 video: v
             })}))
        );
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
            return <Upload replyVideo={this.props.video} redirect={(route) => {
                this.props.redirect(route);
                this.setState({ reply: false });
            }}/>
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
        };
    };
}

interface WatchState {
    badXorName: boolean;
    video: Promise<Video>;
}

export class Watch extends React.Component<WatchProps, WatchState> {
    // ask for the react context
    static contextTypes = {
        router: PropTypes.shape({
            history: PropTypes.shape({
                push: PropTypes.func.isRequired,
            }).isRequired,
            staticContext: PropTypes.object
        }).isRequired
    }

    constructor(props: WatchProps) {
        super(props);

        this.state = {
            video: this.mkVideo(props).catch(this.handleVideoError.bind(this)),
            badXorName: false,
        };
    }

    private mkVideo(props): Promise<Video> {
        const match: string[] = WATCH_URL_RE.exec(props.location.pathname);
        if (match.length !== 2) {
            return Promise.reject(new Error("Watch: bad path"));
        }

        return Video.readFromStringXorName(match[1]);
    }

    componentWillReceiveProps(nextProps: WatchProps) {
        this.state.video.then( v => v.drop() );
        this.setState({ video: this.mkVideo(nextProps).catch(this.handleVideoError) });
    }

    private handleVideoError(err) {
        console.error(`handleVideoError err=${err}`);
        this.setState({ badXorName: true });
    }

    // destructor
    private async componentWillUnmount() {
        await this.state.video.then(v => v.drop());
    }

    private routePushFun(route: string): void {
        this.context.router.history.push(route);
    }

    render() {
        const body =
            this.state.badXorName ?
                <Jumbotron style={{ width: '100%', padding: '50px' }}>
                    <h1>Bad Frames URL!</h1>
                    <p>It looks like the video you want is not on the SafeNET</p>
                </Jumbotron>
            : <VideoPlayer video={this.state.video} redirect={this.routePushFun.bind(this)} />
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

