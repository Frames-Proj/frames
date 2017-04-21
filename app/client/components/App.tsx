import * as React from 'react';
import { Tab, Row, Col, Nav, NavItem, OverlayTrigger, Popover} from 'react-bootstrap';
import { NavLink } from 'react-router-dom'

import { Home } from './Home';
import { FramesURLBar } from "./FramesURLBar";
import { SignIn } from './SignIn';
import { Maybe } from "../ts/maybe";

import Config from "../ts/global-config";

export interface AppProps {
    routes: {
        title: string,
        path: string,
        exact: boolean,
        component: any,
        show: boolean
    }[]
}

export interface AppState {
    longName: Maybe<string>
}

export class App extends React.Component<AppProps, AppState> {

    constructor() {
        super();
        this.state = { longName: Config.getInstance().getLongName() };
    }

    static contextTypes = {
        router: React.PropTypes.shape({
            history: React.PropTypes.shape({
                push: React.PropTypes.func.isRequired,
            }).isRequired,
            staticContext: React.PropTypes.object
        }).isRequired
    }

    updateLongName() {
        this.setState({ longName: Config.getInstance().getLongName() });
    }

    componentDidUpdate() {
        if (!this.state.longName.equals(Config.getInstance().getLongName(), (x, y) => x === y)) {
            this.setState({ longName: Config.getInstance().getLongName() });
        }
    }

    render() {

        const popoverClickRootClose = (
            <Popover id="popover-trigger-click-root-close" title="Sign In">
                <SignIn updateLongName={this.updateLongName.bind(this)}/>
            </Popover>
        );

        const initialOverlayShow = this.state.longName.isNothing();

        return (
            <div style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                <Row style={{
                    display: 'flex',
                    margin: '0px',
                    height: '100%'
                }}>
                    <Col style={{
                        height: '100%',
                        background: '#222'
                    }}>
                        <div style={{
                            height: '70px',
                            color: '#F53240',
                            fontSize: '25px',
                            lineHeight: '25px',
                            cursor: 'default',
                            padding: '22.5px 0px 22.5px 25px'
                        }}>
                            <i className="fa fa-film" aria-hidden="true" style={{ marginRight: '10px'}}></i>
                        </div>
                        <Nav bsStyle="pills" stacked>
                            {this.props.routes.map((route, index) => {
                                if (route.show)
                                    return (
                                        <ul className="nav-route">
                                            <NavLink to={route.path} activeClassName='active' exact={route.exact}>
                                                {route.title}
                                            </NavLink>
                                        </ul>
                                    );
                                else
                                    return;
                            })}
                        </Nav>
                    </Col>
                    <Col style={{
                        display: 'flex',
                        flex: '1',
                        flexDirection: 'column',
                        margin: '0 auto',
                        height: '100%'
                    }}>
                        <div style={{
                            display: 'flex',
                            height: '70px',
                            background: '#222',
                            color: 'white',
                            margin: '0px',
                            padding: '23px 30px 23px 10px',
                            width: '100%',
                            fontSize: '24px'
                        }}>
                            <div style={{
                                display: 'inline-block',
                                transform: 'translateY(-5px)',
                                color: 'gray'
                            }}>
                                <i id="navbtn-back" 
                                   onClick={this.context.router.history.goBack} 
                                   className="fa fa-angle-left" 
                                   aria-hidden="true" 
                                   style={{
                                    marginRight: '20px'
                                }}></i>
                                <i id="navbtn-forward" 
                                   onClick={this.context.router.history.goForward} 
                                   className="fa fa-angle-right" 
                                   aria-hidden="true"></i>
                            </div>
                            <div style={{
                                flex: '1',
                                margin: '0px 50px',
                                justifyContent: 'center'
                            }}>
                                <FramesURLBar/>
                            </div>
                            <div style={{
                                float: 'right',
                                fontSize: '14px',
                                padding: '5px 0px',
                                color: 'gray'
                            }}>
                                <OverlayTrigger trigger="click" rootClose defaultOverlayShown    
={initialOverlayShow} placement="bottom" overlay={popoverClickRootClose}>
                                    <div style={{
                                        cursor: 'pointer'
                                    }}>
                                        <i className="fa fa-user-circle-o" aria-hidden="true" style={{
                                            marginRight: '5px'
                                        }}></i>
                                        {this.state.longName.caseOf({
                                            just: n => n,
                                            nothing: () => "Guest"
                                        })}
                                    </div>
                                </OverlayTrigger>
                            </div>
                        </div>
                        <div style={{
                            height: 'calc(100% - 70px)'
                        }}>
                            {this.props.children}
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }

};
