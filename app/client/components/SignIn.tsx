import * as React from 'react';
import { Jumbotron } from 'react-bootstrap';
import { prepareSignIn, addLongName, updateLongName } from '../../client/ts/signIn-utils';

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

interface SignInProp {
    updateLongName: () => any
}

interface SignInState {
    signedIn: boolean;
}

export class SignIn extends React.Component<SignInProp, SignInState> {

    constructor(props) {
        super(props);
        this.state = {
            signedIn: this.signedIn()
        }
        CONFIG.addLongNameChangeListener(() => this.setState({signedIn: this.signedIn()}));
    }

    componentDidMount() {
        prepareSignIn.bind(this)();
    }

    private signedIn() {
        return CONFIG.getLongName().isJust();
    }

    render() {

        var guest_warning: JSX.Element = null;
        if (!this.state.signedIn) {
            guest_warning = (
                <div>
                    <hr/>
                    <div style={{
                        color: 'gray',
                        marginTop: '10px',
                        border: 'solid rgb(245, 50, 64) 1px',
                        borderRadius: '5px'
                    }}>
                        <div style={{
                            color: 'white',
                            backgroundColor: 'rgb(245, 50, 64)',
                            padding: '5px 10px'
                        }}>
                            <i className="fa fa-exclamation-triangle" aria-hidden="true" style={{
                                marginRight: '5px'
                            }}></i> WARNING
                        </div>
                        <div style={{
                            padding: '10px'
                        }}>
                            To be able to upload, reply to, or comment on videos, you need to select a LongName other than "Guest." 
                        </div>
                    </div>
                </div>
            );
        } 

        return (
            <div>
                <div>
                    <div>
                        Select LongName
                    </div>
                    <select ref="nameDropdown" onChange={updateLongName.bind(this)}></select>
                    <hr/>
                    <div>
                        Add LongName
                    </div>
                    <input type="text" ref="longName"/>
                    <p ref="error_msg"></p>
                    <button className="add-btn" onClick={addLongName.bind(this)}>
                        <i className="fa fa-plus-circle" aria-hidden="true"></i> Add this Long Name</button>
                    { guest_warning }
                </div>
            </div>
        )
    }
};
