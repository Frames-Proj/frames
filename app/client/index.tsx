import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tab, Row, Col, Nav, NavItem } from 'react-bootstrap';

import { Home } from './components/Home';
import { Discover } from './components/Discover';
import { Upload } from "./components/Upload";


class App extends React.Component<{}, {}> {

    render() {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                <Tab.Container id="video-categories" defaultActiveKey="discover">
                    <Row style={{
                        display: 'flex',
                        margin: '0px',
                        height: '100%'
                    }}>
                        <Col style={{
                            height: '100%',
                            background: '#222',
                            paddingTop: '40px'
                        }}>
                            <Nav bsStyle="pills" stacked>
                                <div style={{
                                    color: '#F53240',
                                    fontSize: '20px',
                                    cursor: 'default',
                                    marginBottom: '20px',
                                    padding: '0px 50px 0px 25px'
                                }}>
                                    <i className="fa fa-film" aria-hidden="true" style={{ marginRight: '10px'}}></i> 
                                    <span style={{ letterSpacing: '1px' }}>Frames</span>
                                </div>
                                <NavItem eventKey="discover">
                                    Discover
                                </NavItem>
                                <NavItem eventKey="upload">
                                    Upload
                                </NavItem>
                                <NavItem eventKey="me">
                                    Me
                                </NavItem>
                            </Nav>
                        </Col>
                        <Col style={{
                            display: 'flex',
                            flex: '1',
                            margin: '0 auto',
                            height: '100%'
                        }}>
                            <Tab.Content animation style={{
                                height: '100%',
                                width: '100%'
                            }}>
                                <Tab.Pane eventKey="discover" style={{
                                    height: '100%',
                                    width: '100%'
                                }}>
                                    <Discover/>
                                </Tab.Pane>
                                <Tab.Pane eventKey="me">
                                    Tab 2 content
                                </Tab.Pane>
                                <Tab.Pane eventKey="upload">
                                    <Upload/>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        )
    }

};

ReactDOM.render(<App/>, document.getElementById("react-content"));
