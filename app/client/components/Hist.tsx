import * as React from "react";
import { Jumbotron, Navbar, Nav, NavItem } from "react-bootstrap";
import { Maybe } from "../ts/maybe";
import { CachedVideoInfoStringy, VideoFactory } from "../ts/video-cache";
import VideoThumbnail, { VTArg } from "./VideoThumbnail";

interface HistState {
    cachedVids: Maybe<CachedVideoInfoStringy[]>;
};

interface HistProps {
};

// just a view of the videos that we have on disk.
export class Hist extends React.Component<HistProps, HistState> {

    constructor(props) {
        super(props);

        this.state = {
            cachedVids: Maybe.nothing<CachedVideoInfoStringy[]>()
        };

        VideoFactory.getInstance().then(vf => {
            this.setState({ cachedVids: Maybe.just(vf.getCachedVideos()) });
            vf.addCacheChangeListener(cvs => {
                this.setState({ cachedVids: Maybe.just(cvs) })
            }, "Hist");
        });
    }

    render() {
        return this.state.cachedVids.caseOf({
            nothing: () => {
                return (
                    <div style={{
                        fontSize: "20px",
                        color: "gray",
                        height: "calc(100% - 100px)",
                        width: "calc(100% - 100px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "50px",
                        border: "dashed 1px gray"
                    }}>
                        Waiting for the video cache to load. This should not take long.
                    </div>
                );
            },
            just: cvs => {
                const thumbnails = cvs.map((cv: CachedVideoInfoStringy) => {
                    return (<VideoThumbnail
                                style={{ display: "inline-block", padding: "0px 20px 0px 0px" }}
                                arg={new VTArg(cv.xorName)}/>);

                });
                return (
                    <div style={{
                        height: "calc(100% - 100px)",
                        width: "calc(100% - 100px)",
                        margin: "50px"
                    }}>
                        { thumbnails }
                    </div>
                );
            }
        });
    }

};
