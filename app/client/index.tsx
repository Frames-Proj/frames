import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router, Route, NavLink, Switch, Redirect } from 'react-router-dom'

import { App } from './components/App';
import { Home } from './components/Home';
import { Discover } from './components/Discover';
import { Upload } from "./components/Upload";
import { Watch } from "./components/Watch";
import { Hist } from './components/Hist';
import { UserOverview } from './components/Me';
import startupHook from "./ts/startup-hooks";
import Config from "./ts/global-config";
import { Maybe } from "./ts/maybe";

const CONFIG: Config = Config.getInstance();

interface SidebarRoute {
    title: string;
    path: string;
    exact: boolean;
    component: any,
    show: boolean
}

const sidebarRoutes: SidebarRoute[] = [
    {
        title: 'Discover',
        path: '/',
        exact: true,
        component: Discover,
        show: true
    },
    {
        title: 'Watch',
        path: '/watch/*',
        exact: true,
        component: Watch,
        show: false
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
    },
    {
        title: 'Me',
        path: '/me',
        exact: false,
        component: UserOverview,
        show: true
    }
];

class Root extends React.Component<{}, {signedIn: boolean}> {
    private static didAttachListener: boolean = false;

    constructor() {
        super();
        this.state = {
            signedIn: CONFIG.getLongName().caseOf({
                just: _ => true,
                nothing: () => false
            })
        };

        if (!Root.didAttachListener) {
            CONFIG.addLongNameChangeListener((longNameOpt: Maybe<string>) => {
                longNameOpt.caseOf({
                    just: (_: string) => this.setState({ signedIn: true }),
                    nothing: () => this.setState({ signedIn: false })
                });
            });
            Root.didAttachListener = true;
        }
    }

    render() {
        const showSidebarRoutes = sidebarRoutes.filter((s: SidebarRoute) => this.state.signedIn || s.title !== 'Me');
        return (
            <div style={{
                width: '100%',
                height: '100%'
            }}>
                <Router>
                    <App routes={showSidebarRoutes}>
                        <Switch>
                            {showSidebarRoutes.map((route, index) => (
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

// make sure all the directories we rely on to be there really exist.
startupHook();

ReactDOM.render(<Root/>, document.getElementById('react-content'));
