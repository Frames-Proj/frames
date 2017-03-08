import * as React from 'react';
import { Jumbotron, Navbar, Nav, NavItem } from 'react-bootstrap'

import { VideosNav } from './Navbar'

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
                    <p>Here's the latest and the greatest on Frames.</p>
                </Jumbotron>
                <VideosNav
                    categories={this.state.categories}
                    default={this.state.activeCategory}
                    onSelect={this.onVideosNavChange}
                />
            </div>
        );
    }

};
