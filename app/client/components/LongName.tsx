import * as React from 'react';
import { prepareSignIn, addLongName } from '../../client/ts/signIn-utils';

export class LongNameForm extends React.Component<{}, {}> {

    componentDidMount() {
        prepareSignIn.bind(this)();
    }

    render() {
        return (
            <div style={{padding: "50px"}}>
                <h2>Select or Create a LongName</h2>
                <p>Select a LongName here</p>
                <select ref="nameDropdown" ></select>
                <p> Or you can create a longname </p>
                <input type="text" ref="longName"/>
                <p ref="error_msg"></p>
                <button onClick={addLongName.bind(this)}>Add this Long Name</button>
            </div>
        )
    }
}
