import * as React from "react";

import Video from "../ts/video-model"
import VideoComment from "../ts/comment-model"

import { InvalidHandleError } from "safe-launcher-client";
import { ChasingArrowsLoadingImage } from "./Animations";
import { PropTypes } from "react";

import { Maybe } from "../ts/maybe";

import Config from "../ts/global-config";
const CONFIG: Config = Config.getInstance();

interface CommentsProps {
    video: Video;
}

interface CommentsState {
    signedIn: boolean;
    comments: Maybe<JSX.Element[]>;
    commentValue: string;
    submissionStatus: Maybe<string>;
}

export default class ReplyTree extends React.Component<CommentsProps, CommentsState> {

    constructor(props: CommentsProps) {
        super(props);
        this.state = {
            signedIn: this.signedIn(),
            comments: Maybe.nothing<JSX.Element[]>(),
            commentValue: '',
            submissionStatus: Maybe.nothing<string>()
        }
        this.render.bind(this);
        this.postComment = this.postComment.bind(this);
        this.handleCommentChange = this.handleCommentChange.bind(this);
        this.setComments(this.props.video);
        CONFIG.addLongNameChangeListener(() => this.setState({signedIn: this.signedIn()}));
    }

    private setComments(v: Video): Promise<void> {
        return v.getNumComments().then((n: number) => {
            this.getAllComments(this.props.video, 0, n, [])
        });
    }

    componentWillReceiveProps(nextProps: CommentsProps): void {
        this.setState({
            comments: Maybe.nothing<JSX.Element[]>()
        });
        this.setComments(nextProps.video);
    }

    private getAllComments(v: Video, curr: number, total: number, comments: VideoComment[]): void {
        if (total == 0) {
            this.setState({ comments: Maybe.just(
                [<div>
                    There are no comments yet. Leave the first!
                </div>])
            });
        } else if (curr == total) {
            comments.sort((a, b) => {
                if (a.date < b.date)
                    return -1;
                else if (a.date == b.date)
                    return 0;
                else
                    return 1;
            });

            var commentsJSX: JSX.Element[] = comments.map((vc) =>{
                return (
                    <div className="comment" style={{
                        border: 'solid 1px #EAEAEA',
                        padding: '15px',
                    }}>
                        <div style={{
                            marginBottom: '10px',
                            color: 'gray',
                            display: 'flex',
                            flexDirection: 'row'
                        }}>
                            { vc.owner }
                            <div style={{
                                marginLeft: 'auto'
                            }}>
                                { this.getDate(vc.date)}
                            </div>
                        </div>
                        <div>
                            { vc.text }
                        </div>
                    </div>
                )
            });

            this.setState({ comments: Maybe.just(commentsJSX) });
        } else {
            v.getComment(curr).then(vc => {
                comments.push(vc);
                this.getAllComments(v, curr + 1, total, comments);
            }).catch(err => {
                // When the page gets refreshed, the Watch component will drop the video,
                // invalidating all the member handles. In this case the `componentWillReceiveProps`
                // method on this component will fire with a new video object, and another
                // `setComments` job will start. It is then ok to ignore `InvalidHandleError`s.
                // and abort the job (which we do by not recursing).
                if (err instanceof InvalidHandleError) return;
                else throw err;
            });
        }
    }

    private getDate(d: Date): JSX.Element {

        const now: Date = new Date();
        const diff: number = now.getTime() - d.getTime();
        var commentTime: string = "";
        var ago: number;

        const s_in_minute: number = 60000;
        const s_in_hour: number = s_in_minute * 60;
        const s_in_day: number = s_in_hour * 24;
        const s_in_week: number = s_in_day * 7;
        const s_in_month: number = s_in_week * 31;
        const s_in_year: number = s_in_month * 12;

        if (diff < s_in_minute) {
            ago = Math.floor((diff) / 1000);
            commentTime = ago + " second" + (ago == 1 ? "" : "s") + " ago"
        } else if (diff < s_in_hour) {
            ago = Math.floor((diff) / s_in_minute);
            commentTime = ago + " minute" + (ago == 1 ? "" : "s") + " ago"
        } else if (diff < s_in_day) {
            ago = Math.floor((diff) / s_in_hour);
            commentTime = ago + " hour" + (ago == 1 ? "" : "s") + " ago"
        } else if (diff < s_in_week) {
            ago = Math.floor((diff) / s_in_day);
            commentTime = ago + " day" + (ago == 1 ? "" : "s") + " ago"
        } else if (diff < s_in_month) {
            ago = Math.floor((diff) / s_in_week);
            commentTime = ago + " week" + (ago == 1 ? "" : "s") + " ago"
        } else if (diff < s_in_year) {
            ago = Math.floor((diff) / s_in_month);
            commentTime = ago + " month" + (ago == 1 ? "" : "s") + " ago"
        } else {
            ago = Math.floor((diff) / s_in_year);
            commentTime = ago + " year" + (ago == 1 ? "" : "s") + " ago"
        }

        return (<div>{ commentTime }</div>)
    }

    private handleCommentChange(event): void {
        this.setState({ commentValue: event.target.value });
    }

    private signedIn() {
        return CONFIG.getLongName().isJust();
    }

    private postComment(): void {

        // no blank comments
        if (this.state.commentValue == '')
            return;

        this.props.video.addComment(this.state.commentValue).then(() => {
            this.setState({
                comments: Maybe.nothing<JSX.Element[]>() ,
                commentValue: ''
            });
            this.setComments(this.props.video);
        }).catch(err => {
            console.error(err)
            throw err;
        });

    }

    public render() {

        var commentForm: JSX.Element; 

        if (this.state.signedIn) {
            commentForm = (
                <div>
                    <textarea onChange={this.handleCommentChange} value={this.state.commentValue} id="comment-field" style={{
                        height: '50px',
                        width: '100%',
                        resize: 'vertical',
                        border: 'solid 1px #EAEAEA',
                        padding: '15px'
                    }}/>
                    <div style={{
                        width: '100%',
                        display: 'flex'
                    }}>
                        <button onClick={this.postComment} className="add-btn" style={{
                            marginTop: '10px',
                            marginLeft: 'auto'
                        }} ><i className="fa fa-plus-circle" aria-hidden="true" ></i> Add Your Comment</button>
                    </div>
                </div>
            );
        } else {
            commentForm = (
                <div style={{
                    flex: 1,
                    marginTop: '10px',
                    padding: '2px',
                    color: 'red'
                }}>
                    To add your own comment, please sign in.
                </div>
            );
        }

        return (
            <div style={{
                border: 'solid 1px #EAEAEA',
                padding: '20px',
                marginTop: '30px'
            }}>
                <div style={{
                    fontWeight: 'bold',
                    borderBottom: 'solid 1px #EAEAEA',
                    marginBottom: '10px',
                    paddingBottom: '5px'
                }}>
                    Comments
                </div>
                <div id="comments-frame">
                    {this.state.comments.caseOf({
                        nothing: () => <p>Loading comments...</p>,
                        just: comments => (
                            <div>
                                { comments }
                            </div>)
                    })}
                </div>
                <div>
                    { commentForm }
                </div>
            </div>
        );

    }

}

