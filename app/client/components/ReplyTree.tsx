import * as React from "react";

import { Upload } from "./Upload";
import Video from "../ts/video-model"
import { SerializedDataID, withDropP } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";
import VideoThumbnail, { VTArg } from "./VideoThumbnail"
import { PropTypes } from "react";

import { safeClient, WATCH_URL_RE } from "../ts/util";
import { Maybe } from "../ts/maybe";

interface ReplyTreeProps {
    video: Video;
    redirect: (route: string) => void;
}

interface ReplyTreeState {
    reply: boolean;
    parent: Maybe<JSX.Element>;
    replies: Maybe<JSX.Element[]>;
}

export default class ReplyTree extends React.Component<ReplyTreeProps, ReplyTreeState> {

    constructor(props: ReplyTreeProps) {
        super(props);
        this.state = {
            reply: false,
            parent: Maybe.nothing<JSX.Element>(),
            replies: Maybe.nothing<JSX.Element[]>()
        };
        this.render.bind(this);
        this.setParent(this.props.video);
        this.setChildren(this.props.video);
    }

    componentWillReceiveProps(nextProps: ReplyTreeProps): void {
        this.setState({
            reply: false,
            parent: Maybe.nothing<JSX.Element>(),
            replies: Maybe.nothing<JSX.Element[]>()
        });
        this.setParent(nextProps.video);
        this.setChildren(nextProps.video);
    }

    private setParent(v: Video): void {
         v.parentVideoXorName.caseOf({
            nothing: () => {},
            just: name => {this.setState({ parent: Maybe.just(
                <VideoThumbnail arg={new VTArg(name)} />)
            })}
         });
    }

    private setChildren(v: Video): Promise<void> {
        return v.getNumReplyVideos().then((n: number) => this.getAllReplies(v, 0, n, []));
    }

    private getAllReplies(v: Video, curr: number, total: number, replies: JSX.Element[]): void {
        if (total == 0) {
            this.setState({ replies: Maybe.just(
                [<div>
                    There are no replies yet. Be the first!
                </div>])
            });
        } else if (curr == total) {
            this.setState({ replies: Maybe.just(replies) });
        } else {
            v.getReplyVideoXorName(curr).then(name => {
                replies.push(<VideoThumbnail arg={new VTArg(name)} />);
                this.getAllReplies(v, curr + 1, total, replies);
            });
        }
    }

    private renderReplyTree(): JSX.Element {
        return (
            <div style={{
                marginTop: '30px',
                marginRight: '30px',
                border: 'solid 1px #EAEAEA',
                padding: '30px'
            }}>
                {this.state.parent.caseOf({
                    nothing: () => null,
                    just: parent => (
                        <div>
                            <div style={{
                                marginBottom: '10px'
                            }}>
                                Previous Video:
                            </div>
                            <div style={{
                                margin: '15px 0px'
                            }}>
                                { parent }
                            </div>
                            <div style={{
                                width: '100%',
                                borderBottom: 'solid 1px #EAEAEA',
                                marginBottom: '15px'
                            }}></div>
                        </div>)
                })}
                {this.state.replies.caseOf({
                    nothing: () => <p>Loading replies...</p>,
                    just: replies => (
                        <div id="replies">
                            <div>
                                Replies:
                            </div>
                            <div style={{
                                margin: '15px 0px'
                            }}>
                                { replies }
                            </div>
                            <button onClick={() => this.setState({ reply: true })} className="add-btn"><i className="fa fa-plus-circle" aria-hidden="true"></i> Add Your Reply</button>
                        </div>)
                })}
            </div>
        );
    }

    public render() {

        if (this.state.reply) {
            return <Upload replyVideo={this.props.video} redirect={(route) => {
                this.props.redirect(route);
                this.setState({ reply: false });
            }}/>
        } else {
            return this.renderReplyTree();
        }

    }

}
