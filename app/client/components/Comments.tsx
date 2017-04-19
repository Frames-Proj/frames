import * as React from "react";

import Video from "../ts/video-model"
import VideoComment from "../ts/comment-model"

import { ChasingArrowsLoadingImage } from "./Animations";
import { PropTypes } from "react";

import { Maybe } from "../ts/maybe";

interface CommentsProps {
    video: Video;
}

interface CommentsState {
    comments: Maybe<JSX.Element[]>;
}

export default class ReplyTree extends React.Component<CommentsProps, CommentsState> {

    constructor(props: CommentsProps) {
        super(props);
        this.state = {
            comments: Maybe.nothing<JSX.Element[]>()
        }
        this.render.bind(this);
        this.postComment = this.postComment.bind(this);
        this.setComments(this.props.video);
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

    private getAllComments(v: Video, curr: number, total: number, comments: JSX.Element[]): void {
        if (total == 0) {
            this.setState({ comments: Maybe.just(
                [<div>
                    There are no comments yet. Leave the first!
                </div>])
            });
        } else if (curr == total) {
            this.setState({ comments: Maybe.just(comments) });
        } else {
            v.getComment(curr).then(vc => {
                comments.push(
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
                );
                this.getAllComments(v, curr + 1, total, comments);
            });
        }
    }

    private getDate(d: Date): JSX.Element {

        const now: Date = new Date();
        const diff: number = now as number - d as number;
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

    private postComment(): void {
        const comment: string = (document.getElementById("comment-field") as HTMLInputElement).value;
        (document.getElementById("comment-field") as HTMLInputElement).value = "";
        this.props.video.addComment(comment).then(() => {
            this.setState({ comments: Maybe.nothing<JSX.Element[]>() });
            this.setComments(this.props.video);
        });
       
    }

    public render() {

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
                    <textarea id="comment-field" style={{
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
                        <button onClick={this.postComment} id="add-comment" style={{
                            marginTop: '10px',
                            marginLeft: 'auto'
                        }} ><i className="fa fa-plus-circle" aria-hidden="true" ></i> Add Your Comment</button>
                    </div>
                </div>
            </div>
        );

    }

}

