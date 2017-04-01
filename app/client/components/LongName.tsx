import * as React from 'react';
import { fileExists } from '../../client/ts/util';

interface LongNameRegister {
    longName: string
}

export class LongNameForm extends React.Component<LongNameRegister, {}> {

    render() {
        return (
            <div style={{padding: "50px"}}>
                <h2>Long Name Form</h2>
                <select id="longNames"></select>
                <p> Or you can create a longname </p>
                <input type="text" id="longName"/>
                <p id="error_msg"></p>
                <button id="addLongName">Add This LongName</button>
            </div>
        )
    }
}
