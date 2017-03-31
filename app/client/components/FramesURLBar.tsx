import * as React from "react";
import { FormGroup, FormControl } from "react-bootstrap"
import { DataIDHandle, SerializedDataID, SafeClient } from "safe-launcher-client";

import { safeClient, ValidationState } from "../ts/util";
const sc = safeClient;

export interface FramesURLBarProps {
}

interface FramesURLBarState {
    url: string;
}

const URL_RE: RegExp = /frames:\/\/([a-zA-Z0-9]+)/;

export class FramesURLBar extends React.Component<FramesURLBarProps, FramesURLBarState> {
    private urlInput;
    constructor(props) {
        super(props);
        this.state = { url: "" };
    }

    private handleChange(e) {
        this.setState({ url: e.target.value });
    }

    private getValid(): ValidationState {
        return URL_RE.test(this.state.url) ? "success" : "error";
    }

    private handleSubmit(e) {
        e.preventDefault(); // don't redirect

        if (this.getValid() === "success") {
            const match: string[] = URL_RE.exec(this.state.url);
            if (match.length !== 2) {
                return Promise.reject(new Error("Failed to parse frames URL. Impossible."));
            }
            const xorName: SerializedDataID = Buffer.from(match[1], "base64");

            console.log(`TODO: redirect to watch page at ${match[1]}`);
        }
    }

    public render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <FormGroup controlId="urlBar"
                    validationState={this.getValid()}>
                    <FormControl type="text"
                            value={this.state.url}
                            placeholder="Enter a Frames URL"
                            onChange={this.handleChange.bind(this)}
                            style={{
                                display: 'flex',
                                margin: '0 auto',
                                width: "50%"
                            }} />
                </FormGroup>
            </form>
        );
    }
}



