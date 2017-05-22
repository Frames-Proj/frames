import * as React from "react";

import {Jumbotron, Tab, Row, Col, Nav, NavItem, Grid, Thumbnail, Button} from "react-bootstrap";

import VideoThumbnail from "./VideoThumbnail";
import { Maybe } from "../ts/maybe";
import { VTArg } from "./VideoThumbnail";
import { UserProfile, currentUserProfile } from "../ts/user-model";

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

interface MeState {
    uploads: Maybe<string[]>;
}

export class UserOverview extends React.Component<{}, MeState> {

    constructor() {

        super();
        this.state = {
            uploads: Maybe.nothing<string[]>(),
        }

        this.render.bind(this);
        this.getMyVideos.bind(this);
    }

    componentDidMount() {
        // This relies on being attached after the currentUserProfile
        // listener. Pretty fragile, but it should work for now.
        // TODO: cleanup
        CONFIG.addLongNameChangeListener(this.getMyVideos);
        this.getMyVideos(CONFIG.getLongName());
    }

    // dummy function for now
    private getMyVideos(longName: Maybe<string>): void {
        if (longName.isNothing()) return;

        currentUserProfile.onJust(cupP => cupP.then(up => {
            this.setState({uploads: Maybe.just(up.data.uploadedVideos)});
        }));
    }

    private getThumbnails(): JSX.Element {
        return this.state.uploads.caseOf({
            nothing: () => {
                return (
                    <div style={{
                        fontSize: '20px',
                        color: 'gray',
                        height: 'calc(100% - 100px)',
                        width: 'calc(100% - 100px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '50px',
                        border: 'dashed 1px gray'
                    }}>
                        Videos you upload to Frames will show up here.
                    </div>
                );
            },
            just: xornames => {
                var thumbnails = xornames.map((xorname) => {
                    return (<VideoThumbnail
                                style={{ display: "inline-block", padding: "0px 20px 0px 0px" }}
                                arg={new VTArg(xorname)}/>);

                });
                return (
                    <div style={{
                        height: "calc(100% - 100px)",
                        width: "calc(100% - 100px)",
                        margin: "50px"
                    }}>
                        { thumbnails }
                    </div>
                )
            }
        });
    }


    render() {

        var thumbnails = this.getThumbnails();

        return (
            <div style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Jumbotron style={{
                    width: '100%',
                    padding: '50px'
                }}>
                    <h1>Me</h1>
                    <p>My presence on Frames.</p>
                </Jumbotron>

                <div style={{
                    flex: '1'
                }}>
                    { thumbnails }
                </div>

            </div>
        )
    }

}
