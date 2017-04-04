import * as React from 'react';
import { Tab, Row, Col, Nav, NavItem } from 'react-bootstrap';
import { NavLink } from 'react-router-dom'


import { Home } from './Home';

export interface AppProps {
    routes: {
        title: string,
        path: string,
        exact: boolean,
        component: any,
        show: boolean
    }[]
}

export class App extends React.Component<AppProps, {}> {

    constructor() {
        super();
    }

    static contextTypes = {
        router: React.PropTypes.shape({
            history: React.PropTypes.shape({
                push: React.PropTypes.func.isRequired,
            }).isRequired,
            staticContext: React.PropTypes.object
        }).isRequired
    }

    render() {
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
                                display: 'flex',
                                flex: '1',
                                margin: '0px 50px',
                                fontSize: '14px',
                                color: 'gray'
                            }}>
                                <div style={{
                                    border: 'solid 1px gray',
                                    borderRight: 'none',
                                    borderRadius: '2px 0px 0px 2px',
                                    padding: '2px 0px 2px 5px'
                                }}>
                                    frames://
                                </div>
                                <input id='url-navbar' style={{
                                    flex: '1',
                                    border: 'solid 1px gray',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    padding: '2px 0px',
                                    background: 'none'
                                }}>
                                </input>
                                <div style={{
                                    border: 'solid 1px gray',
                                    borderLeft: 'none',
                                    borderRadius: '0px 2px 2px 0px',
                                    padding: '2px 5px 2px 0px'
                                }}>
                                    <i className="fa fa-arrow-circle-o-right" aria-hidden="true"></i>
                                </div>
                            </div>
                            <div style={{
                                flex: '1'
                            }}>
                            </div>
                            <div style={{
                                float: 'right',
                                fontSize: '14px',
                                padding: '5px 0px',
                                color: 'gray'
                            }}>
                                <i className="fa fa-user-circle-o" aria-hidden="true" style={{
                                    marginRight: '5px'
                                }}></i> Nicholas
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