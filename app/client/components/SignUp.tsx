import * as React from 'react';

interface SignUpForm {
    longName: string
}

export class SignUp extends React.Component<{}, SignUpForm> {
    render() {
        return (
            <h1> Sign Up! </h1>
        )
    }
};
