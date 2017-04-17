import * as React from 'react';
import { Jumbotron } from 'react-bootstrap';
import { LongNameForm } from './LongName';
import { prepareSignIn, addLongName, updateLongName } from '../../client/ts/signIn-utils';

export class SignIn extends React.Component<{}, {}> {

    componentDidMount() {
        prepareSignIn.bind(this)();
    }
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
                <div style={{padding: "50px"}}>
                    <h2>Select or Create a LongName</h2>
                    <p>Select a LongName here</p>
                    <select ref="nameDropdown" onChange={updateLongName.bind(this)}></select>
                    <p> Or you can create a longname </p>
                    <input type="text" ref="longName"/>
                    <p ref="error_msg"></p>
                    <button onClick={addLongName.bind(this)}>Add this Long Name</button>
                </div>
            </div>
        )
    }
};
