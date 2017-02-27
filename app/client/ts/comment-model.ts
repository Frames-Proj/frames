

import { DataIDHandle, SerializedDataID, AppendableDataHandle, Drop,
         StructuredDataHandle, withDropP, AppedableDataMetadata,
         TYPE_TAG_VERSIONED
       } from "safe-launcher-client";

import * as crypto from "crypto";

import { safeClient } from "./util";
const sc = safeClient;

export default class VideoComment implements Drop {

    public readonly owner: string;
    public readonly text: string;

    // A 53 bit integer (thanks javascript!) representing the number of
    // seconds since unix epoch at the last edit.
    public readonly date: number;

    // The structured data version of the parent at the time of
    // the last edit. Including this info will make it easier for
    // users to tell when a comment does not make sense because the
    // parent edited it.
    public readonly parentVersion: number;

    // true if this is a direct reply to a video
    public readonly isRootComment: boolean;

    // a pointer to a video if `this.isRootComment`, otherwise
    // a pointer to a comment
    public readonly parent: DataIDHandle;

    public readonly replies: AppendableDataHandle;

    //
    // Private members
    //

    private readonly replyMetadata: Promise<AppedableDataMetadata>;

    constructor(owner: string, text: string, date: number,
                parentVersion: number, isRootComment: boolean,
                parent: DataIDHandle, replies: AppendableDataHandle) {
        this.owner = owner;
        this.text = text;
        this.date = date;
        this.parentVersion = parentVersion;
        this.isRootComment = isRootComment;
        this.parent = parent;
        this.replies = replies;

        this.replyMetadata = this.replies.getMetadata();
    }
    public async drop(): Promise<void> {
        await this.parent.drop();
        await this.replies.drop();
    }

    // TODO(ethan): test to make sure that this does not fail when dereferencing
    // the root comment.
    public static async read(did: DataIDHandle): Promise<VideoComment> {
        const sdH: StructuredDataHandle =
            (await sc.structured.fromDataIdHandle(did)).handleId;

        return withDropP(sdH, async (ciH) => {
            const content: any = await ciH.readAsObject();
            if (!isCommentInfoStringy(content))
                throw new Error("Malformed comment info");

            const ci: CommentInfo = toCI(content);

            const parent: DataIDHandle = await sc.dataID.deserialise(ci.parent);

            const replies: AppendableDataHandle =
                (await withDropP(await sc.dataID.deserialise(ci.replies), (r) => {
                    return sc.ad.fromDataIdHandle(r);
                })).handleId;

            return new VideoComment(ci.owner, ci.text, ci.date, ci.parentVersion,
                                    ci.isRootComment, parent, replies);
        });
    }

    // TODO(ethan): test to make sure that this method is idempotent
    public async write(): Promise<void> {
        const payload: CommentInfo = {
            owner: this.owner,
            text: this.text,
            date: this.date,
            isRootComment: this.isRootComment,
            parentVersion: this.parentVersion,
            parent: await this.parent.serialise(),
            replies: await withDropP(await this.replies.toDataIdHandle(), (r) => {
                return r.serialise();
            })
        }
        const payloadStr: string = JSON.stringify(toCIStringy(payload));

        const hash: string = crypto.createHash("sha256")
            .update(payloadStr)
            .digest("hex");

        await withDropP(await sc.structured.create(
            hash, TYPE_TAG_VERSIONED, payloadStr), async (sd) => {
                await sd.save();
            });
    }

    public async getNumReplies(): Promise<number> {
        return (await this.replyMetadata).dataLength;
    };

    public async getReply(i: number): Promise<VideoComment> {
        if (i >= await this.getNumReplies() || i < 0)
            throw new Error(`VideoComment::getReply(${i}) index out of range!`);

        return withDropP(await this.replies.at(i), (di) => {
            return VideoComment.read(di);
        })
    };

}


//
// The stuff we actually store on the network. Boilerplate.
//

interface CommentInfoBase {
    owner: string;
    text: string;
    date: number;
    isRootComment: boolean;
    parentVersion: number;
}
function isCommentInfoBase(x: any): x is CommentInfoBase{
    return  ( typeof x.owner === "string"
              && typeof x.text === "string"
              && typeof x.date === "number"
              && typeof x.isRootComment === "boolean"
              && typeof x.parentVersion === "number");
}
interface CommentInfoStringy extends CommentInfoBase {
    parent: string; // base64 encoded
    replies: string; // base64 encoded
}
function isCommentInfoStringy(x: any): x is CommentInfoStringy {
    return (typeof x.parent === "string"
            && typeof x.replies === "string"
            && isCommentInfoBase(x));
}
function toCI(x: CommentInfoStringy): CommentInfo {
    return {
        owner: x.owner,
        text: x.text,
        date: x.date,
        isRootComment: x.isRootComment,
        parentVersion: x.parentVersion,
        parent: Buffer.from(x.parent, "base64"),
        replies: Buffer.from(x.replies, "base64")
    }
}
interface CommentInfo extends CommentInfoBase {
    parent: Buffer; // base64 encoded
    replies: Buffer; // base64 encoded
}
function toCIStringy(x: CommentInfo): CommentInfoStringy {
    return {
        owner: x.owner,
        text: x.text,
        date: x.date,
        isRootComment: x.isRootComment,
        parentVersion: x.parentVersion,
        parent: x.parent.toString("base64"),
        replies: x.replies.toString("base64")
    }
}
