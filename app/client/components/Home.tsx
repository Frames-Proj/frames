import * as React from 'react';
import { Tab, Row, Col, Nav, NavItem } from 'react-bootstrap'

export class Home extends React.Component<{}, {}> {

    render() {
        return (
            <Tab.Container id="video-categories" defaultActiveKey="first">
                <Row style={{
                    display: 'flex',
                    margin: '0px',
                    height: '100%'
                }}>
                    <Col style={{
                        height: 'calc(100% - 52px)',
                        background: '#222'
                    }}>
                        <Nav bsStyle="pills" stacked>
                            <NavItem eventKey="featured">
                                Featured Videos
                            </NavItem>
                            <NavItem eventKey="topTen">
                                Top Ten
                            </NavItem>
                            <NavItem eventKey="funny">
                                Funny
                            </NavItem>
                            <NavItem eventKey="controversial">
                                Controversial
                            </NavItem>
                        </Nav>
                    </Col>
                    <Col style={{
                        display: 'flex',
                        flex: '1',
                        margin: '0 auto',
                        background: '#EAEAEA'
                    }}>
                        <Tab.Content animation>
                            <Tab.Pane eventKey="featured">
                                <h1>
                                    Featured Videos
                                </h1>
                            </Tab.Pane>
                            <Tab.Pane eventKey="topTen">
                                Tab 2 content
                            </Tab.Pane>
                            <Tab.Pane eventKey="funny">
                                Tab 2 content
                            </Tab.Pane>
                            <Tab.Pane eventKey="controversial">
                                Tab 2 content
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        );
    }

};
