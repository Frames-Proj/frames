import * as React from "react";
import { Jumbotron, Navbar, Nav, NavItem } from "react-bootstrap";

import Video from "../ts/video-model";
import VideoCache from "../ts/video-cache";
import { SerializedDataID, withDropP } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";
import VideoThumbnail from "./VideoThumbnail"
import { PropTypes } from "react";
import ReplyTree from "./ReplyTree";
import VideoInfo from "./VideoInfo";
import Comments from "./Comments";
import VideoCache from "../ts/video-cache";
import Config from "../ts/global-config";

import { safeClient, WATCH_URL_RE } from "../ts/util";
import { Maybe } from "../ts/maybe";
const sc = safeClient;
const CONFIG: Config = Config.getInstance();


interface VideoPlayerProps {
    video: Promise<Video>;
    redirect: (route: string) => void;
}

interface ResolvedVideo {
    video: Video;
    videoFile: string;
}

interface VideoPlayerState {
    resolvedVideo: Maybe<ResolvedVideo>;
}
class VideoPlayer extends React.Component<VideoPlayerProps, VideoPlayerState> {

    constructor(props: VideoPlayerProps) {
        super(props);
        this.state = {
            resolvedVideo: Maybe.nothing<ResolvedVideo>()
        };
        // wait for the download to finish
        this.resolveVideo(props);
        this.render.bind(this);
    }

    private resolveVideo(props: VideoPlayerProps): Promise<void> {
        return props.video.then((v: Video) =>
            v.file.caseOf({
              nothing: () => Promise.reject<void>(
                  "Watch.tsx:VideoPlayer:resolveVideo shallow video. Impossible."),
              just: file => file.then(f => {
                  this.setState({ resolvedVideo: Maybe.just({
                     videoFile: f,
                     video: v
                  })});
              })
            })
        );
    }

    componentWillReceiveProps(nextProps: VideoPlayerProps): void {
        this.setState({ resolvedVideo: Maybe.nothing<ResolvedVideo>() });
        this.resolveVideo(nextProps);
    }

    public render() {

        function mkActualPlayer(rv: ResolvedVideo): JSX.Element {
            return (
                <div style={{
                    height: '100%',
                    width: '100%',
                    overflow: 'scroll'
                }}>
                    {/* TODO: get the correct mime type from the video model */}
                    <div style={{
                        height: '600px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: 'black'
                    }}>
                        <video controls src={`file://${rv.videoFile}`} type={"video/mp4"} style={{
                            height: '600px',
                            width: '100%',
                            objectFit: 'contain',
                            backgroundColor: 'none',
                            margin: '0px auto'
                        }} />
                    </div>
                    <div style={{
                        display: 'flex',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            flex: '3',
                            padding: '30px'
                        }}>
                            <VideoInfo video={rv.video}/>
                            <Comments video={rv.video}/>
                        </div>
                        <div style={{
                            flex: '1'
                        }}>
                            <ReplyTree video={rv.video} redirect={this.props.redirect}/>
                        </div>
                    </div>
                </div>
            );
        }

        return this.state.resolvedVideo.caseOf({
            nothing: () => <ChasingArrowsLoadingImage />,
            just: mkActualPlayer.bind(this)
        });
        
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

    private async mkVideo(props): Promise<Video> {
        const match: string[] = WATCH_URL_RE.exec(props.location.pathname);
        if (match.length !== 2) {
            return Promise.reject(new Error("Watch: bad path"));
        }

        const xorName: string = match[1];
        return await CONFIG.getLongName().caseOf({
            just: async (longName: string) =>
                (await VideoCache.getInstance(longName)).getFromXorName(xorName),
            nothing: async () => await Video.readFromStringXorName(xorName)
        });
    }

    componentWillReceiveProps(nextProps: WatchProps) {
        this.state.video.then( v => {
            v.drop();
            this.setState({ video: this.mkVideo(nextProps).catch(this.handleVideoError) });
        });
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

