import * as React from "react";
import { Jumbotron, Navbar, Nav, NavItem } from "react-bootstrap";

import { VideosNav } from "./Navbar";
import { VideosList } from "./VideosList";
import Video from "../ts/video-model"
import { SerializedDataID, withDropP } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";

import { safeClient } from "../ts/util";
const sc = safeClient;

import Isvg from "react-inlinesvg";

// <?xml version="1.0" encoding="UTF-8" standalone="no"?>

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
    videoFile: string; // @nullable. once @Graham's maybe stuff is merged we should use that
    video: Promise<Video>;
}


import * as fs from "fs";
function VideoPlayer({ videoFile }) {
    console.log(videoFile);
    return (
        <video width={400} controls src={`file://${videoFile}`} type={"video/mp4"} >
        </video>
    );
}

export class Watch extends React.Component<WatchProps, WatchState> {

    constructor(props: WatchProps) {
        super(props);

        async function mkVideo(): Promise<Video> {
            const ptr: SerializedDataID = Buffer.from(props.match.params.xorName, "base64");
            return withDropP(await sc.dataID.deserialise(ptr), xorName => Video.read(xorName));
        }

        this.state = {
            video: mkVideo().catch(this.handleVideoError.bind(this)),
            badXorName: false,
            videoFile: null
        };

        // wait for the download to finish
        this.state.video.then(v => v.file.then( f => this.setState({ videoFile: f })));
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
            : this.state.videoFile === null ?
                <ChasingArrowsLoadingImage />
            :
                <VideoPlayer videoFile={this.state.videoFile} />;
        return (
            <div style={{
                height: '100%',
                width: '100%'
            }}>
                {body}
            </div>
        );
    }

};

