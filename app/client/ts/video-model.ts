
import { SafeFile, withDropP, DataIDHandle,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         SerializedDataID, AppendableDataHandle,
         Drop, AppedableDataMetadata, StructuredDataMetadata
       } from "safe-launcher-client";

import { safeClient, NoUserNameError } from "./util";
const sc = safeClient;
import * as fs from "fs";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";
import * as stream from "stream";
import VideoComment from "./comment-model";
import { Maybe } from "./maybe";
import extractThumbnail from "./thumbnail";
import CachedAppendableDataHandle from "./cached-appendable-data";
import { VideoFactory } from "./video-cache";

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

export class UnsupportedVideoFormatError extends Error {
    constructor(mimeType: string) {
        super(`Unsupported Video Format: ${mimeType}`);
    }
}

export default class Video implements Drop {
    // @friend-class VideoFactory

    private readonly data: VideoInfo;
    public get title(): string { return this.data.title; }
    public get description(): string { return this.data.description; }
    public get owner(): string { return this.data.owner; }
    public get parentVideoXorName(): Maybe<string> {
        return this.data.parentVideoXorName == null ?
            Maybe.nothing<string>() : Maybe.just(this.data.parentVideoXorName);
    }

    // file is a Maybe<Promise<_>> because we don't always download the video file
    // (i.e. when we just want to create a VideoIcon).
    public readonly file: Maybe<Promise<string>>;

    // a promise to the a local path pointing to the relevant thumbnail file
    public readonly thumbnailFile: Promise<string>;

    // a pointer to the parent video, if there is one
    public readonly commentReplies: CachedAppendableDataHandle;
    public readonly videoReplies: CachedAppendableDataHandle;

    private videoData: StructuredDataHandle; // the data on the network
    private metadata: Promise<StructuredDataMetadata>;

    // TODO: remove the promise here.
    public getNumComments(): Promise<number> {
        return Promise.resolve(this.commentReplies.length);
    }
    public getComment(i: number): Promise<VideoComment> {
        return this.commentReplies.withAt(i, did => VideoComment.read(did));
    }
    public async getCommentXorName(i: number): Promise<string> {
        return this.commentReplies.withAt(i, async did => (await did.serialise()).toString("base64"));
    }

    public async getNumReplyVideos(): Promise<number> {
        return Promise.resolve(this.videoReplies.length);
    }
    public async getReplyVideo(i: number): Promise<Video> {
        return this.videoReplies.withAt(i, did => this.vf.read(did));
    }
    public async getReplyVideoXorName(i: number): Promise<string> {
        return this.videoReplies.withAt(i, async did => (await did.serialise()).toString("base64"));
    }


    constructor( data: VideoInfo
               , file: Maybe<Promise<string>>
               , thumbnailFile: Promise<string>
               , commentReplies: CachedAppendableDataHandle
               , videoReplies: CachedAppendableDataHandle
               , private vf: VideoFactory) {
        this.data = data;

        this.file = file;
        this.thumbnailFile = thumbnailFile;

        this.commentReplies = commentReplies;
        this.videoReplies = videoReplies;

        this.videoData = null;
    }
    public async drop(): Promise<void> {
        await Promise.all([
            this.commentReplies.drop(),
            this.videoReplies.drop(),
            this.videoData.drop()
        ]);
    }
    public _setVideoData(vd: StructuredDataHandle): void {
        this.videoData = vd;
        this.metadata = vd.getMetadata();
    }
    // TODO: memoize this guy
    public xorName(): Promise<DataIDHandle> {
        return this.videoData.toDataIdHandle();
    }
    public async stringXorName(): Promise<string> {
        return withDropP(await this.xorName(), async di =>
                         Promise.resolve((await di.serialise()).toString("base64")) );
    }

    // private but we need to expose it so that the `VideoFactory` friend class can access it.
    // @returns a promise for a dataID pointing to the written video meta-node
    public async _write(): Promise<StructuredDataHandle> {
        const localVideoFile: string =
            await this.file.caseOf({
                just: f => f,
                nothing: () => { throw new Error(
                    "Tried to write File which was read shallowly. This should be impossible."); }
            });
        const localThumbnailFile: string = await this.thumbnailFile;

        async function writeSafeFile(localFile: string, safeFile: string, mimeTypes: string[]): Promise<void> {
            const fileSize: number = fs.statSync(localFile).size;
            const fStream: stream.Readable = fs.createReadStream(localFile);
            const mimeType: string =
                await readChunk(localFile, 0, 64).then((b: Buffer) => {
                    return fileType(b).mime;
                });

            if (mimeTypes.indexOf(mimeType) === -1) {
                throw new UnsupportedVideoFormatError(mimeType);
            }

            return sc.nfs.file.create("app", safeFile, fStream, fileSize, mimeType);
        }

        await writeSafeFile(localVideoFile, this.data.videoFile, CONFIG.SUPPORTED_VIDEO_MIME_TYPES);

        // upload the thumbnail file, and sanity check the output of ffmpeg
        await writeSafeFile(localThumbnailFile, this.data.thumbnailFile, ["image/png"]);

        const viH: StructuredDataHandle =
            await sc.structured.create(this.title, TYPE_TAG_VERSIONED,
                                       toVIStringy(this.data));
        await viH.save();
        return viH;
    }

    public async addComment(text: string): Promise<VideoComment> {
        const owner: string = CONFIG.getLongName().caseOf({
            just: n => n,
            nothing: () => { throw new NoUserNameError("You must select a username."); }
        });

        const comment = await VideoComment.new(
            owner,
            text,
            new Date(),
            (await this.metadata).version,
            true,
            await this.videoData.toDataIdHandle());

        await this.commentReplies.append(await comment.xorName());
        return comment;
    }

    public async addVideoReply(title: string, description: string, videoFile: string): Promise<Video> {
        const thisXorName: string =
            await withDropP(await this.xorName(), async n => (await n.serialise()).toString("base64"));

        const videoPromise = this.vf._makeVideo(title, description, videoFile, thisXorName);
        videoPromise.then(async video =>
                          withDropP(await video.xorName(), n => this.videoReplies.append(n)));

        return videoPromise;

    }


};

interface VideoInfoBase {
    title: string;
    description: string;
    videoFile: string;
    owner: string;
    thumbnailFile: string; // as base64 encoded thumbnail image
}
function isVideoInfoBase(x: any): x is VideoInfoBase {
    return  ( x != null
              && typeof x.title === "string"
              && typeof x.description === "string"
              && typeof x.owner === "string"
              && typeof x.videoFile === "string"
              && typeof x.thumbnailFile === "string");
}
export interface VideoInfoStringy extends VideoInfoBase {
    videoReplies: string; // base64 encoded
    commentReplies: string; // base64 encoded
    parentVideoXorName?: string; // base64 encoded
}
export function isVideoInfoStringy(x: any): x is VideoInfoStringy {
    return (x != null
            && typeof x.videoReplies === "string"
            && typeof x.commentReplies === "string") && isVideoInfoBase(x);
}
export function toVI(vi: VideoInfoStringy): VideoInfo {
    let ret: VideoInfo = {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        thumbnailFile: vi.thumbnailFile,
        videoReplies: Buffer.from(vi.videoReplies, "base64"),
        commentReplies: Buffer.from(vi.commentReplies, "base64")
    };
    if (vi.parentVideoXorName) ret.parentVideoXorName = vi.parentVideoXorName;

    return ret;
}
export interface VideoInfo extends VideoInfoBase {
    videoReplies: SerializedDataID;
    commentReplies: SerializedDataID;
    parentVideoXorName?: string;
}
export function toVIStringy(vi: VideoInfo): VideoInfoStringy {
    let ret: VideoInfoStringy = {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        thumbnailFile: vi.thumbnailFile,
        videoReplies: vi.videoReplies.toString("base64"),
        commentReplies: vi.commentReplies.toString("base64")
    };
    if (vi.parentVideoXorName) ret.parentVideoXorName = vi.parentVideoXorName;
    return ret;
}
export function isVideoInfo(x: any): x is VideoInfo {
    return (x != null
            && x.videoReplies instanceof Buffer
            && x.commentReplies instanceof Buffer)
            && isVideoInfoBase(x);
}
