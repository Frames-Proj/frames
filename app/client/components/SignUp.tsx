import * as React from 'react';
import { Jumbotron } from 'react-bootstrap';

interface SignUpForm {
    longName: string
}

export class SignUp extends React.Component<{}, SignUpForm> {
    render() {
        return (
            <div>
                <Jumbotron style={{
                    width: '100%',
                    padding: '50px'
                }}>
                    <h1>Sign Up</h1>
                    <p>Choose a longName to represent you</p>
                </Jumbotron>

            </div>
        )
    }
};
