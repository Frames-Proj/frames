import * as React from 'react';
import { Navbar, NavItem, Nav } from 'react-bootstrap'

export interface VideoNavProps {
    categories: string[],
    default: string,
    onSelect: (event: any) => void
}

interface VideoNavState {
    active: string
}

export class VideosNav extends React.Component<VideoNavProps, VideoNavState> {

    constructor(props) {
        super(props);
        this.state = { active : this.props.default };
        this.onTabChange = this.onTabChange.bind(this);
    }

    onTabChange(event: any) {
        console.log("here");
        this.setState({ active: event });
        this.props.onSelect(event);
    }

    render() {

        var navItems = this.props.categories.map(function(category) {
            console.log(this.state.active);
            console.log(category);
            return (
                <NavItem className={this.state.active === category ? 'active' : ''}
                    eventKey={category}
                    key={category}>
                    {category}
                </NavItem>
            );
        }.bind(this));

        return (
            <Navbar>
                <Nav onSelect={this.onTabChange}>
                    {navItems}
                </Nav>
            </Navbar>
        );
    }

};
