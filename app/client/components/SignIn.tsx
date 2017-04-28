import * as React from 'react';
import { Jumbotron } from 'react-bootstrap';
import { Notification } from "./SignInNotification";

import { safeClient } from "../ts/util";
import { Maybe } from "../ts/maybe";

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

interface SignInProp {
    updateLongName: () => any
}

interface SignInState {
    signedIn: boolean;
    names: string[];
    addName: string;
    addNameStatus: Maybe<string>;
}

export class SignIn extends React.Component<SignInProp, SignInState> {

    constructor(props) {
        super(props);
        this.state = {
            signedIn: this.signedIn(),
            names: [],
            addName: "",
            addNameStatus: Maybe.nothing<string>()
        };
        CONFIG.addLongNameChangeListener(() => this.setState({signedIn: this.signedIn()}));
        this.loadNames();
        this.handleAddNameChange = this.handleAddNameChange.bind(this);
        this.addLongName = this.addLongName.bind(this);
        this.updateLongName = this.updateLongName.bind(this);
        this.reorderNames = this.reorderNames.bind(this);
    }

    private reorderNames(): void {
        //this is so that the current longName is first on the list
        const currentLongName: Maybe<string> = CONFIG.getLongName();
        if (currentLongName.isJust()) {
            var reorderedNames = this.state.names;
            reorderedNames.sort((a,b) => {
                const cases = {
                    nothing: () => "Guest",
                    just: name => name
                };
                if (a == currentLongName.caseOf(cases)) return -1;
                if (b == currentLongName.caseOf(cases)) return 1;
                return 0;
            });
            this.setState({ names: reorderedNames });
        }
    }

    // load the current longNames into the list
    private async loadNames(): Promise<void> {

        var names: string[] = ["Guest"];

        await safeClient.dns.getLongNames().then((data) => {
            data.forEach((name) => { names.push(name) });
        });

        this.setState({ names: names });
        this.reorderNames();
    }

    private handleAddNameChange(event): void {
        this.setState({ addName: event.target.value });
    }

    private async addLongName(): Promise<void> {

        const name: string = this.state.addName;

        if (name) {
            await safeClient.dns.register(name).then(() => {
                this.setState({ addNameStatus: Maybe.just("success")});
            }, (err) => {
                this.setState({ addNameStatus: Maybe.just("error")});
            });
            this.loadNames();
            this.setState({ addName: ''});
        }
    };

    private updateLongName(event) {
        const config = Config.getInstance();
        const longName: string = event.target.value;
        config.setLongName(longName === "Guest" ? Maybe.nothing<string>() : Maybe.just(longName));
        this.props.updateLongName();
    }

    private signedIn() {
        return CONFIG.getLongName().isJust();
    }

    render() {

        var guest_warning: JSX.Element = null;
        if (!this.state.signedIn) {
            guest_warning = (
                <Notification type="warning" message='To be able to upload, reply to, or comment on videos, you need to select a LongName other than "Guest."'/>
            );
        }

        var name_options = this.state.names.map(name => {
            return (<option value={name}>{name}</option>);
        });

        var add_name_status = this.state.addNameStatus.caseOf({
            nothing: () => null,
            just: status => {
                if (status == "success")
                    return (
                        <Notification type="success" message="LongName successfully added!"/>
                    )
                else if (status == "error")
                    return (
                        <Notification type="error" message="There was an error processing your request. Please choose a different LongName."/>
                    )
            }
        })

        return (
            <div>
                <div>
                    <div style={{
                        marginBottom: '5px'
                    }}>
                        Select LongName
                    </div>
                    <select onChange={this.updateLongName}>
                        { name_options }
                    </select>
                    <hr/>
                    <div style={{
                        marginBottom: '5px'
                    }}>
                        Add LongName
                    </div>
                    <input type="text" onChange={this.handleAddNameChange} value={this.state.addName}/>
                    <button className="add-btn" onClick={this.addLongName} style={{
                        marginTop: '10px'
                    }}>
                        <i className="fa fa-plus-circle" aria-hidden="true"></i> Add this Long Name</button>
                    { add_name_status }
                    { guest_warning }
                </div>
            </div>
        )
    }
};
