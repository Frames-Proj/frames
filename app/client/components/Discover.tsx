import * as React from 'react';
import { Jumbotron, Navbar, Nav, NavItem } from 'react-bootstrap';

import { VideosList } from './VideosList';

interface DiscoverState {
    categories: string[],
    activeCategory: string
}

export class Discover extends React.Component<{}, DiscoverState> {

    constructor() {

        super();

        this.state = {
            categories: ['Featured', 'Trending', 'Funny', 'Controversial'],
            activeCategory: 'Featured',

        }

        this.onVideosNavChange = this.onVideosNavChange.bind(this);

    }

    onVideosNavChange(event: string) {
        this.setState({activeCategory: event});
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
                    <h1>Discover</h1>
                    <p>Get the conversation with some of the videos below. Make sure to check out the replies, or post a reply of your own!</p>
                </Jumbotron>
                <div style={{
                    height: 'calc(100% - 294px)',
                    width: '100%'
                }}>
                    <VideosList/>
                </div>
            </div>
        );
    }

};
