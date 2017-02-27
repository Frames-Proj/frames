
import { SafeFile, withDropP, DataIDHandle,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         SerializedDataID, AppendableDataHandle,
         Drop, AppedableDataMetadata
       } from "safe-launcher-client";

import { safeClient } from "./util";
import * as fs from "fs";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";
import * as stream from "stream";
import { VideoComment } from "./comment-model";

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

class UnsupportedVideoFormatError extends Error {
    constructor(mimeType: string) {
        super(`Unsupported Video Format: ${mimeType}`);
    }
}

export class Video implements Drop {

    public readonly title: string;
    public readonly description: string;
    public readonly file: Promise<string>; // TODO: verify that there isn't a filepath type
    public readonly owner: string;

    public readonly commentReplies: AppendableDataHandle;
    public readonly videoReplies: AppendableDataHandle;

    private readonly commentMetadata: Promise<AppedableDataMetadata>;
    private readonly videoRepliesMetadata: Promise<AppedableDataMetadata>;

    constructor(title: string, description: string, owner: string, file: Promise<string>,
                commentReplies: AppendableDataHandle, videoReplies: AppendableDataHandle) {
        this.title = title;
        this.description = description;
        this.owner = owner;
        this.file = file;

        this.commentReplies = commentReplies;
        this.videoReplies = videoReplies;

        this.commentMetadata = commentReplies.getMetadata();
        this.videoRepliesMetadata = videoReplies.getMetadata();
    }
    public async drop(): Promise<void> {
        await this.commentReplies.drop();
        await this.videoReplies.drop();
    }

    /**
     *  Construct a new video from raw parts.
     *
     *  TODO: Once we have the DNS api working, this method needs to do the
     *  right thing when it comes to setting the owner field with a long name or something.
     *
     * @returns a new Video. The video has not been persisted to the SAFEnet until `write` is called
     */
    public static async new(title: string, description: string, localVideoFile: string): Promise<Video> {
        // Ownership of these guys is going to be passed to the created video
        const commentReplies: AppendableDataHandle = await safeClient.ad.create(title + " commentReplies");
        const videoReplies: AppendableDataHandle = await safeClient.ad.create(title + " videoReplies");

        return new Video(title, description, "TODO OWNER",
                         Promise.resolve(localVideoFile),
                         commentReplies, videoReplies);
    }

    // @returns a promise for a dataID pointing to the written video meta-node
    public async write(): Promise<DataIDHandle> {
        await this.commentReplies.save().catch(err => {
            // if the appendable data already exists, ignore the error. We don't need
            // to update it.
            if ((err.res != null && err.res.statusCode === 400)
                && (err.res != null && err.res.body != null
                    && err.res.body.errorCode === -23) ) {
                return;
            }
            throw err;
        });
        await this.videoReplies.save().catch(err => {
            if ((err.res != null && err.res.statusCode === 400)
                && (err.res != null && err.res.body != null
                    && err.res.body.errorCode === -23) ) {
                return;
            }
            throw err;
        });

        const safeVideoFile: string = `${CONFIG.SAFENET_VIDEO_DIR}/${this.title}`;
        const localPath: string = await this.file;

        let fileSize: number = fs.statSync(localPath).size;
        let fStream: stream.Readable = fs.createReadStream(localPath);
        const mimeType: string = await readChunk(localPath, 0, 64).then((b: Buffer) => {
            return fileType(b).mime;
        });

        if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
            throw new UnsupportedVideoFormatError(mimeType);
        }

        await safeClient.nfs.file.create("app", safeVideoFile, fStream,
                                            fileSize, mimeType);

        const payload: VideoInfo = {
            title: this.title,
            description: this.description,
            owner: this.owner,
            videoFile: safeVideoFile,
            videoReplies: await (await this.videoReplies.toDataIdHandle()).serialise(),
            commentReplies: await (await this.commentReplies.toDataIdHandle()).serialise(),
        };

        const viH: StructuredDataHandle =
            await safeClient.structured.create(this.title, TYPE_TAG_VERSIONED, toVIStringy(payload));
        return withDropP(viH, async (vi: StructuredDataHandle) => {
            await vi.save();
            return await vi.toDataIdHandle();
        });
    }

    public async getNumComments(): Promise<number> {
        return (await this.commentMetadata).dataLength;
    }
    public async getComment(i: number): Promise<VideoComment> {
        return Promise.resolve(new VideoComment());
    }

    public async getNumReplyVideos(): Promise<number> {
        return (await this.videoRepliesMetadata).dataLength;
    }
    public async getReplyVideo(i: number): Promise<Video> {
        return withDropP(await this.videoReplies.at(i), async (vDId: DataIDHandle) => {
            return getVideo(vDId);
        });
    }

};

interface VideoInfoBase {
    title: string;
    description: string;
    videoFile: string;
    owner: string;
}
function isVideoInfoBase(x: any): x is VideoInfoBase {
    return  ( typeof x.title === "string"
              && typeof x.description === "string"
              && typeof x.owner === "string"
              && typeof x.videoFile === "string");
}
interface VideoInfoStringy extends VideoInfoBase {
    videoReplies: string; // base64 encoded
    commentReplies: string; // base64 encoded
}
function isVideoInfoStringy(x: any): x is VideoInfoStringy {
    return (typeof x.videoReplies === "string" &&
            typeof x.commentReplies === "string") && isVideoInfoBase(x);
}
function toVI(vi: VideoInfoStringy): VideoInfo {
    return {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        videoReplies: Buffer.from(vi.videoReplies, "base64"),
        commentReplies: Buffer.from(vi.commentReplies, "base64")
    };
}
interface VideoInfo extends VideoInfoBase {
    videoReplies: SerializedDataID;
    commentReplies: SerializedDataID;
}
function toVIStringy(vi: VideoInfo): VideoInfoStringy {
    return {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        videoReplies: vi.videoReplies.toString("base64"),
        commentReplies: vi.commentReplies.toString("base64")
    };
}
function isVideoInfo(x: any): x is VideoInfo {
    return (x.videoReplies instanceof Buffer
            && x.commentReplies instanceof Buffer)
            && isVideoInfoBase(x);
    }


export async function getVideo(dataId: DataIDHandle): Promise<Video> {
    const sdH: StructuredDataHandle =
        (await safeClient.structured.fromDataIdHandle(dataId)).handleId;

    return withDropP(sdH, async (viHandle: StructuredDataHandle) => {
        const vis = await viHandle.readAsObject();
        if (!isVideoInfoStringy(vis))
            throw new Error("Malformed VideoInfo response.");

        const vi: VideoInfo = toVI(vis);
        const video: SafeFile =
            await safeClient.nfs.file.get("app", vi.videoFile);

        const mimeType = fileType(video.body).mime;
        if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
            throw new UnsupportedVideoFormatError(mimeType);
        }

        const videoReplies: AppendableDataHandle =
            (await safeClient.ad.fromDataIdHandle(
                await safeClient.dataID.deserialise(vi.videoReplies))).handleId;
        const commentReplies: AppendableDataHandle =
            (await safeClient.ad.fromDataIdHandle(
                await safeClient.dataID.deserialise(vi.commentReplies))).handleId;

        const videoFile = new Promise((resolve, reject) => {
            fs.writeFile(`${CONFIG.APP_VIDEO_DIR}/${vi.title}`, video.body, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        return new Video(vi.title, vi.description, vi.owner, videoFile, commentReplies, videoReplies);
    });
}
