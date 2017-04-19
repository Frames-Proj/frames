import * as React from "react";
import {Jumbotron, Tab, Row, Col, Nav, NavItem, Grid, Thumbnail, Button} from "react-bootstrap";

import Config from "../ts/global-config";
import Video from "../ts/video-model";
import VideoComment from "../ts/comment-model";
import Playlist from "../ts/playlist-model";
import VideoThumbnail from "./VideoThumbnail";
const CONFIG: Config = Config.getInstance();

interface MeProps{
    myVideos: string[];
    myPlaylists: string[];
}

interface MeState {
    myVideos: Video[];
    myVideoThumbs: VideoThumbnail[];
    myPlaylists: Playlist[];
}

export class UserOverview extends React.Component<MeProps, MeState> {
    constructor(props) {
        super(props);
        // TODO: Fetch the user from the props, and each xorname convert to videoThumbnails, the following is temporary
        this.state = {
            myVideos: [],
            myVideoThumbs: [],
            myPlaylists: []
        }
    }

    render() {
        return (
            <div style={{
                height: '100%',
                width: '100%'
            }}>
                <Jumbotron style={{
                    width: '100%',
                    padding: '50px'
                }}>
                    <h1>Me</h1>
                    <p>My Presence on Frames.</p>
                </Jumbotron>

                <Tab.Container defaultActiveKey="first" style={{
                    margin: '35px 10px 20px 10px'

                }}>
                    <Row className="clearfix">
                        <Col sm={2}>
                            <Nav bsStyle="pills" stacked>
                                <NavItem eventKey="first">
                                    My Uploaded Videos
                                </NavItem>
                                <NavItem eventKey="second">
                                    My Playlists
                                </NavItem>
                            </Nav>
                        </Col>
                        <Col sm={5}>
                            <Tab.Content animation>
                                <Tab.Pane eventKey="first">
                                    <div style={{}}>
                                        <Grid>
                                            <Row>
                                                {/*
                                                 {this.state.myVideos.map(function(video) {
                                                 return <Col xs={3}>
                                                     <Thumbnail src="/" href="#" >
                                                     <h3>Title</h3>
                                                     </Thumbnail>
                                                     </Col>;
                                                 })}
                                                 Note: there needs to be some calculation here, every 4 videos needs to
                                                  be wrapped in a new row
                                                 */}
                                                 <Col xs={3}>
                                                    <Thumbnail href="#" src="../client/img/thumbnail.png" >
                                                        <h3>Title1</h3>
                                                    </Thumbnail>
                                                 </Col>
                                                <Col xs={3}>
                                                    <Thumbnail href="#" src="../client/img/thumbnail.png" >
                                                        <h3>Title2</h3>
                                                    </Thumbnail>
                                                 </Col>
                                                <Col xs={3}>
                                                    <Thumbnail href="#" src="../client/img/thumbnail.png" >
                                                        <h3>Title 3</h3>
                                                    </Thumbnail>
                                                </Col>
                                            </Row>
                                        </Grid>
                                    </div>
                                </Tab.Pane>
                                <Tab.Pane eventKey="second">
                                    <Grid>
                                        { /*

                                        {this.state.myPlaylists.map(function(playlist) {
                                            return <Row>
                                                     <Col xs={12}>
                                                        <h3>playlist.title</h3>
                                                     </Col>
                                                   </Row>
                                                   <Row style={{whiteSpace: "nowrap", overflowX: "auto"}}>
                                                     playlist.videos().forEach(function(video) {
                                                        let thumbnail = video.file      Todo: turn the file into a thumbnail
                                                        return <Col xs={3} style={{display: "inline-block",
                                                                                   float: "none"}}>
                                                                 <Thumbnail href="#" src=thumbnail>
                                                                   <h3>video.title</h3>
                                                                 </Thumbnail>
                                                               </Col>
                                                     });
                                                   </Row>
                                        })}

                                        */}
                                        <Row>
                                            <Col xs={12}>
                                                <h3>Playlist Name</h3>
                                            </Col>
                                        </Row>
                                        <Row style={{whiteSpace: "nowrap", overflowX: "auto"}}>
                                            <Col xs={3} style={{display: "inline-block",
                                                                   float: "none"}}>
                                                <Thumbnail href="#" src="../client/img/thumbnail.png">
                                                    <h3>Title 1</h3>
                                                </Thumbnail>
                                            </Col>
                                            <Col xs={3} style={{display: "inline-block",
                                                                   float: "none"}}>
                                                <Thumbnail href="#" src="../client/img/thumbnail.png">
                                                    <h3>Title 1</h3>
                                                </Thumbnail>
                                            </Col>
                                            <Col xs={3} style={{display: "inline-block",
                                                                   float: "none"}}>
                                                <Thumbnail href="#" src="../client/img/thumbnail.png">
                                                    <h3>Title 1</h3>
                                                </Thumbnail>
                                            </Col>
                                            <Col xs={3} style={{display: "inline-block",
                                                                   float: "none"}}>
                                                <Thumbnail href="#" src="../client/img/thumbnail.png">
                                                    <h3>Title 1</h3>
                                                </Thumbnail>
                                            </Col>

                                            <Col xs={3} style={{display: "inline-block",
                                                                   float: "none"}}>
                                                <Thumbnail href="#" src="../client/img/thumbnail.png">
                                                    <h3>Title 1</h3>
                                                </Thumbnail>
                                            </Col>
                                        </Row>
                                    </Grid>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        )
    }

}