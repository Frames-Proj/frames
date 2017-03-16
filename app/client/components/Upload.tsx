import * as React from "react";
import { Jumbotron, FormGroup, ControlLabel, FormControl,
         HelpBlock, Button, Panel, ListGroup, ListGroupItem,
         Modal
       } from "react-bootstrap";

import { remote } from "electron";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

/* const electron = require("electron");
 * const remote = electron.remote;*/

type ValidationState = "error" | "success" | "warning";

interface UploadState {
    videoTitle: string;
    videoDescription: string;
    videoFile: string;
    errorModal: boolean;

    validFlags: Map<string, ValidationState>;
    help: Map<string, string[]>;
}

export class Upload extends React.Component<{}, UploadState> {

    private form;

    constructor() {
        super();

        this.state = {
            videoTitle: "",
            videoDescription: "",
            videoFile: "",
            errorModal: false,
            validFlags: new Map(),
            help: new Map(),
        };

        this.handleTitle = this.handleTitle.bind(this);
        this.getTitleValid = this.getTitleValid.bind(this);

        this.handleDescription = this.handleDescription.bind(this);
        this.getDescriptionValid = this.getDescriptionValid.bind(this);

        this.handleSelectFile = this.handleSelectFile.bind(this);
        this.getFileValid = this.getFileValid.bind(this);

        this.setOk = this.setOk.bind(this);
        this.setErr = this.setErr.bind(this);
        this.appendHelp = this.appendHelp.bind(this);
    }

    private getTitleValid(): ValidationState {
        return this.state.validFlags.get("videoTitle");
    }
    private getDescriptionValid(): ValidationState {
        return this.state.validFlags.get("videoDescription");
    }
    private getFileValid(): ValidationState {
        return this.state.validFlags.get("videoFile");
    }

    private setErr(formElement: string, vs: "warning" | "error", msg: string) {
        this.state.validFlags.set(formElement, vs);
        this.appendHelp(formElement, msg);
    }
    private setOk(formElement: string) {
        this.state.validFlags.set(formElement, "success");
        let help = this.state.help;
        help.set(formElement, []);
        this.setState({ help: help });
    }
    private appendHelp(formElement: string, msg: string): void {
        let help = this.state.help;
        let helpList = help.get(formElement);
        if (helpList == null) {
            helpList = [];
        }
        if (helpList.indexOf(msg) === -1)
            helpList.push(msg);
        help.set(formElement, helpList);
        this.setState({ help: help });
    }

    private handleSubmitClick() {
        function vsOk(vs) {
            return vs === "warning" || vs === "success";
        }
        let ok: boolean = vsOk(this.getTitleValid());
        ok = ok || vsOk(this.getDescriptionValid());
        ok = ok || vsOk(this.getFileValid());
        if (!ok) {
            this.setState({ errorModal: true });
        } else {
            this.handleSubmit();
        }
    }

    private handleSubmit() {
        // TODO: construct the Video object, and write it to the network.
        // This should probably also place the video in the user registry.
        console.log("TODO actually upload the video!");
        this.form.submit();
    }

    private handleTitle(e) {
        this.setOk("videoTitle");
        this.setState({ videoTitle: e.target.value });
    }
    private handleDescription(e) {
        if (! /#[a-zA-Z0-9]+/.test(e.target.value)) {
            this.setErr("videoDescription", "warning",
                        "Throw some #hashtags in your description to make your video easier to find.")
        } else {
            this.setOk("videoDescription");
        }
        this.setState({ videoDescription: e.target.value });
    }
    private handleSelectFile(e) {
        remote.dialog.showOpenDialog({
            title: "Upload Video",
            properties: ["openFile"]
        }, async (files: string[]) => {
            if (files == null || files.length === 0) {
                this.setErr("videoFile", "error", "No file selected");
                return;
            } else if (files.length > 1) {
                this.setErr("videoFile", "error", "Multiple files selected.");
                return;
            }
            const file = files[0];

            const mimeType: string =
                await readChunk(file, 0, 64).then((b: Buffer) => {
                    return fileType(b).mime;
                });

            if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
                this.setErr("videoFile", "error", `Unsupported file format: ${mimeType}`);
                return;
            }

            this.setOk("videoFile");
            this.setState({ videoFile: file });
        });
    }

    private makeHelpText() {
        let tips: JSX.Element[] = [];
        for (let [field, issues] of this.state.help) {
            if (issues.length === 0) continue;

            let issueSort: string = "";
            const validSt = this.state.validFlags.get(field);
            if (validSt === "error") {
                issueSort = "danger";
            } else if (validSt === "warning") {
                issueSort = "warning"
            } else {
                continue; // impossible
            }

            issues.forEach( (help: string) => {
                tips.push(<ListGroupItem key={help}>{help}</ListGroupItem>);
            });
        }

        return (<Panel collapsible defaultExpanded header="Issues">
                    <ListGroup fill>
                        {tips}
                    </ListGroup>
                </Panel>
            );
    }

    private uploadForm() {
        return (
            <form
                onSubmit={this.handleSubmit.bind(this)}
                ref={f => this.form = f}
            >
                <FormGroup controlId="uploadTitle"
                    validationState={this.getTitleValid()}>
                    <FormControl type="text" value={this.state.videoTitle}
                        placeholder="Video Title"
                        onChange={this.handleTitle}
                    />
                <FormControl.Feedback />
                </FormGroup>

                <FormGroup controlId="uploadDescription"
                    validationState={this.getDescriptionValid()}>
                    <FormControl value={this.state.videoDescription}
                        componentClass="textarea"
                        placeholder="Video Description"
                        onChange={this.handleDescription}
                    />
                <FormControl.Feedback />
                </FormGroup>

                <FormGroup controlId="uploadFile"
                    validationState={this.getFileValid()}>
                    <Button onClick={this.handleSelectFile}>
                        Select File
                    </Button>
                <FormControl.Feedback />
                </FormGroup>

                <Button onClick={this.handleSubmitClick.bind(this)}>
                    Submit
                </Button>

                <HelpBlock id="validationHelp">
                    {this.makeHelpText()}
                </HelpBlock>

            </form>
        );
    }

    render() {
        const upload: JSX.Element = this.uploadForm();
        return (
            <div style={{
                height: '100%',
                width: '100%'
            }}>
                <Jumbotron style={{
                    width: '100%',
                    padding: '50px'
                }}>
                    <h1>Upload a Video</h1>
                </Jumbotron>

                <Modal show={this.state.errorModal} onHide={() => this.setState({ errorModal: false })}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h4>There are still some issues with your video!</h4>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => this.setState({ errorModal: false })}>Close</Button>
                </Modal.Footer>
                </Modal>


                <div style={{
                    height: 'calc(100% - 294px)',
                    width: '100%'
                }}>
                    {upload}
                </div>
            </div>
        );
    }

};

