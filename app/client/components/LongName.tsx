import * as React from 'react';
import { prepareSignIn, addLongName } from '../../client/ts/signup-utils';

interface LongNameRegister {
    longName: string
}

export class LongNameForm extends React.Component<LongNameRegister, {}> {

    componentDidMount() {
        prepareSignIn.bind(this)();
    }

    render() {
        return (
            <div style={{padding: "50px"}}>
                <h2>Long Name Form</h2>
                <select ref="nameDropdown" ></select>
                <p> Or you can create a longname </p>
                <input type="text" ref="longName"/>
                <p ref="error_msg"></p>
                <button onClick={addLongName.bind(this)}>Add this Long Name</button>
            </div>
        )
    }
}
