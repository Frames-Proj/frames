import * as React from 'react';
import { Jumbotron } from 'react-bootstrap';
import { LongNameForm } from './LongName';

interface SignInForm {
    longName: string
}

export class SignIn extends React.Component<{}, SignInForm> {
    render() {
        return (
            <div>
                <Jumbotron style={{
                    width: '100%',
                    padding: '50px'
                }}>
                    <h1>SignIn</h1>
                    <p>Choose a longName to represent you</p>
                </Jumbotron>
                <LongNameForm longName="hello"/>
            </div>
        )
    }
};
