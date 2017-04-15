import * as React from "react";
import { PropTypes } from "react";
import { FormGroup, FormControl } from "react-bootstrap"
import { DataIDHandle, SerializedDataID, SafeClient } from "safe-launcher-client";
import { browserHistory } from "react-router";

import { safeClient, ValidationState, WATCH_URL_RE } from "../ts/util";
const sc = safeClient;

export interface FramesURLBarProps {
}

interface FramesURLBarState {
    url: string;
}

const URL_RE: RegExp = /frames:\/\/([a-zA-Z0-9\/\+]+)/;

export class FramesURLBar extends React.Component<FramesURLBarProps, FramesURLBarState> {
    private urlInput;
    constructor(props) {
        super(props);

        // react-router v4 does not provide a place to attach a listener
        // to check if the route has changed. Believe me, I'm mad too.
        window.addEventListener("hashchange", (e) => {
            const urlParts: string[] = e.newURL.split("#");
            if (urlParts.length != 2) {
                console.error("FramesURLBar::constructor::onhashchange url has no hash-part");
                return; // wat
            }
            const hashPart: string = urlParts[1];

            // for now we only represent videos as a frames URL, but once
            // user profiles land, we probably also want those to be checked
            // for here.
            const watchMatch: string[] = WATCH_URL_RE.exec(hashPart);
            if (watchMatch != null && watchMatch.length === 2) {
                const url: string = `frames://${watchMatch[1]}`;
                if (url !== this.state.url) { // `setState` always re-renders. We don't need that.
                    this.setState({ url: `frames://${watchMatch[1]}` });
                }
                return;
            }

            // the current route is not representable as a frames URL
            if (this.state.url !== "") {
                this.setState({ url: "" });
            }
        }, false);

        this.state = { url: "" };
    }

    static contextTypes = {
        router: PropTypes.shape({
            history: PropTypes.shape({
                push: PropTypes.func.isRequired,
            }).isRequired,
            staticContext: PropTypes.object
        }).isRequired
    }


    private handleChange(e) {
        this.setState({ url: e.target.value });
    }

    private getValid(): ValidationState {
        // don't show validation feedback on an empty bar
        if (this.state.url === "") return undefined;

        return URL_RE.test(this.state.url) ? "success" : "error";
    }

    private handleSubmit(e) {
        e.preventDefault(); // don't redirect

        if (this.getValid() === "success") {
            const match: string[] = URL_RE.exec(this.state.url);
            if (match.length !== 2) {
                return Promise.reject(new Error("Failed to parse frames URL. Impossible."));
            }

            this.context.router.history.push(`/watch/${match[1]}`);
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
                                width: "100%"
                            }} />
                </FormGroup>
            </form>
        );
    }
}



