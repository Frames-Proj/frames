

import * as React from 'react';
import { Jumbotron, Navbar, Nav, NavItem } from 'react-bootstrap';

import { VideosNav } from './Navbar';
import { VideosList } from './VideosList';

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
}

export class Watch extends React.Component<WatchProps, WatchState> {

    constructor(props: WatchProps) {
        super(props);
        console.log(`Watching video at ${props.match.params.xorName}`);
        console.log(props);
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
                    <h1>Watch</h1>
                </Jumbotron>
            </div>
        );
    }

};
