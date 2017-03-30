import * as React from "react";
import { Navbar, NavItem, Nav, FormGroup,
         ControlLabel, FormControl } from "react-bootstrap"
import { DataIDHandle, SerializedDataID } from "safe-launcher-client";

/* import { safeClient } from "../ts/util";
 * const sc = safeClient;*/

export interface FramesURLBarProps {
}

interface FramesURLBarState {
    url: string;
}

export class FramesURLBar extends React.Component<FramesURLBarProps, FramesURLBarState> {
    private urlInput;
    constructor(props) {
        super(props);
    }

    private handleChange(e) {
        this.setState({ url: e.target.value });
    }

    private handleSubmit(e) {
        if (e.key === "Enter") {
            console.log(`TODO: go to video at ${this.state.url}`);
        }
    }

    public render() {
        return (
            <FormControl type="text" id="url-bar"
                    placeholder="Enter a Frames URL"
                    onChange={this.handleChange.bind(this)}
                    style={{
                        display: 'flex',
                        margin: '0 auto',
                        width: "50%"
                    }}
                    onKeyPress={this.handleSubmit.bind(this)} />
        );
    }
}


/* function framesURLToDataID(url: string): Promise<DataIDHandle> {
 *     const match: string[] = /frames:\/\/([a-zA-Z0-9]+)/.exec(url);
 *     if (match.length !== 2) {
 *         return Promise.reject(new Error("Failed to parse frames URL"));
 *     }
 *     const xorName: SerializedDataID = Buffer.from(match[1], "base64");
 * 
 *     return sc.dataID.deserialise(xorName);
 * }*/

