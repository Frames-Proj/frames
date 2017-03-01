import * as React from 'react';

import { Component } from './Component';
import { Grid, Row, Col, Clearfix } from 'react-bootstrap';

export class Hello extends React.Component<{}, undefined> {
    
    render() {

        return (
            <h1>Hello world</h1>
        );
    }

}
