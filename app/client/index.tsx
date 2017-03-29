import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link, browserHistory, Switch, Redirect } from 'react-router-dom'
import { Tab, Row, Col, Nav, NavItem } from 'react-bootstrap';

import { Home } from './components/Home';
import { Discover } from './components/Discover';
import { Upload } from "./components/Upload";
import { Hist } from './components/Hist';

const routes = [
    {
        title: 'Discover',
        path: '/',
        exact: true,
        component: Discover,
        show: true
    },
    {
        title: 'Upload',
        path: '/upload',
        exact: false,
        component: Upload,
        show: true
    },
    {
        title: 'History',
        path: '/history',
        exact: false,
        component: Hist,
        show: true
    }
]

class App extends React.Component<{}, {}> {

    render() {
        console.log(location.pathname);
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
                            {routes.map((route, index) => {
                                if (route.show)
                                    return (
                                        <ul className="nav-route">
                                            <Link to={route.path} activeClassName='active'>{route.title}</Link>
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
                        margin: '0 auto',
                        height: '100%'
                    }}>
                        {this.props.children}
                    </Col>
                </Row>
            </div>
        )
    }

};

class Root extends React.Component<{}, {}> {
    constructor() {
        super();
    }

    render() {
        return (
            <div style={{
                width: '100%',
                height: '100%'
            }}>
                <Router>
                    <App>
                        <Switch>
                            {routes.map((route, index) => (
                                <Route key={index} path={route.path} exact={route.exact} component={route.component} />
                            ))}
                            <Redirect from="*" to="/"/>
                        </Switch>
                    </App>
                </Router>
            </div>
        );
    }
}

ReactDOM.render(<Root/>, document.getElementById('react-content'));
