import * as React from "react";
import { Jumbotron, FormGroup, ControlLabel, FormControl,
         HelpBlock, Button, Panel, ListGroup, ListGroupItem,
         Modal, ButtonToolbar
       } from "react-bootstrap";

import { PropTypes } from "react";
import { remote } from "electron";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";
import Video from "../ts/video-model";
import { VIDEO_TITLE_RE, ValidationState, safeClient as sc } from "../ts/util";
import { withDropP, SerializedDataID } from "safe-launcher-client";
import { Maybe } from "../ts/maybe";

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

interface UploadProps {
    replyVideo: Video;
    redirect: (route: string) => void;
}

interface UploadState {
    videoTitle: string;
    videoDescription: string;
    videoFile: string;
    errorModal: boolean;

    validFlags: Map<string, ValidationState>;
    help: Map<string, string[]>;
}

export class Upload extends React.Component<UploadProps, UploadState> {

    // allow us to redirect
    static contextTypes = {
        router: PropTypes.shape({
            history: PropTypes.shape({
                push: PropTypes.func.isRequired,
            }).isRequired,
            staticContext: PropTypes.object
        }).isRequired
    }

    private form;

    constructor(props) {
        super(props);

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

        this.checkUsername(CONFIG.getLongName());
        CONFIG.addLongNameChangeListener(this.checkUsername.bind(this));
    }

    // check a username and set the component validation state accordingly
    // fires on every username change as well as on component creation.
    private checkUsername(ln: Maybe<string>) {
        if (ln.isJust()) {
            this.setOk("username");
        } else {
            this.setErr("username", "error",
                "You need to choose a username in the upper right hand corner in order to upload a video.");
        }
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

    private canSubmit(): boolean {
        // Returns false when all the fields are not empty and not error, else true

        // Check for empties
        if (this.state.videoTitle == "" || this.state.videoDescription == "" || this.state.videoFile == "") {
            return false;
        }

        if (this.state.validFlags.get("videoFile") == "error" ||
            this.state.validFlags.get("videoDescription") == "error" ||
            this.state.validFlags.get("videoTitle") == "error") {
            return false;
        }

        if (CONFIG.getLongName().isNothing()) {
            return false;
        }

        return true;
    }

    private setErr(formElement: string, vs: "warning" | "error", msg: string) {
        this.state.validFlags.set(formElement, vs);
        this.appendHelp(formElement, msg);
    }
    private setOk(formElement: string) {
        this.state.validFlags.set(formElement, "success");
        let help = this.state.help;
        help.set(formElement, []);
        this.removeHelp(formElement);
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

    private removeHelp(formElement: string): void {
        let help = this.state.help;
        help.delete(formElement);       // Delete all elements in the map
        this.setState({help: help});
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
            this.doSubmit();
        }
    }

    private async doSubmit() {
        let video: Video;
        function catchErr(err): Promise<Video> {
            console.error("Upload.tsx:Upload:doSubmit error. This should be impossible.");
            console.error(err);
            throw err;
        }
        if (this.props.replyVideo === undefined) {
            video = await Video.new(this.state.videoTitle, this.state.videoDescription,
                                    this.state.videoFile).catch(catchErr);
        } else {
            video = await (await this.props.replyVideo)
                .addVideoReply(this.state.videoTitle, this.state.videoDescription, this.state.videoFile)
                .catch(catchErr);
        }

        withDropP(await video.xorName(), async (n) => {
            const xorName: SerializedDataID = await n.serialise();
            // TODO: stuff the link in the user profile
            const hash: string = xorName.toString("base64");

            if (this.props.redirect == null) {
                this.context.router.history.push(`/watch/${hash}`);
            } else {
                this.props.redirect(`/watch/${hash}`);
            }
        });
    }

    private handleTitle(e) {
        const title: string = e.target.value;
        if (VIDEO_TITLE_RE.test(title)) {
            this.setOk("videoTitle");
        } else {
            this.setErr("videoTitle", "error", "Videos can only contain letters, numbers, and spaces.");
        }
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
                this.setErr("videoFile", "error", `Unsupported file format: ${mimeType}. 
                            Currently we only support ${CONFIG.SUPPORTED_VIDEO_MIME_TYPES} files`);
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
                ref={f => this.form = f}
                style={{padding: '20px 50px 0px'}}
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
                        rows={5}
                        placeholder="Video Description"
                        onChange={this.handleDescription}
                    />
                <FormControl.Feedback />
                </FormGroup>

                <FormGroup controlId="uploadFile"
                    validationState={this.getFileValid()}
                >
                    <ButtonToolbar justified>
                        <Button onClick={this.handleSelectFile}
                        bsSize="large">
                            Select File
                        </Button>

                        <Button onClick={this.handleSubmitClick.bind(this)}
                                bsStyle="primary"
                                bsSize="large"
                                disabled={!this.canSubmit()}>
                            Submit
                        </Button>
                    </ButtonToolbar>

                <FormControl.Feedback />
                </FormGroup>


                <HelpBlock id="validationHelp" style={{"margin-top": "20px"}}>
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
                    <h1>Upload</h1>
                    <p>Share your videos with the SafeNet.</p>
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

