
import { SafeFile, withDropP, DataIDHandle,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         SerializedDataID, AppendableDataHandle,
         Drop,
       } from "safe-launcher-client";

import { safeClient } from "./util";
import * as fs from "fs";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";
import * as stream from "stream";

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

    constructor(title: string, description: string, owner: string, file: Promise<string>,
                commentReplies: AppendableDataHandle, videoReplies: AppendableDataHandle) {
        this.title = title;
        this.description = description;
        this.owner = owner;
        this.file = file;
    }
    public async drop(): Promise<void> {
        await this.commentReplies.drop();
        await this.videoReplies.drop();
    }

    // @returns a promise for a dataID pointing to the written video meta-node
    public async write(): Promise<DataIDHandle> {

        const safeVideoFile: string = `${CONFIG.SAFENET_VIDEO_DIR}/${this.title}`;
        const localPath: string = await this.file;

        let fileSize: number = fs.statSync(localPath).size;
        let fStream: stream.Readable = fs.createReadStream(localPath);
        const mimeType: string = await readChunk(localPath, 0, 64).then((b: Buffer) => {
            return fileType(b).mime;
        });

        if ($.inArray(mimeType, CONFIG.SUPPORTED_VIDEO_MIME_TYPES) === -1) {
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
            await safeClient.structured.create(this.title, TYPE_TAG_VERSIONED, payload);
        return withDropP(viH, async (vi: StructuredDataHandle) => {
            await vi.save();
            return await vi.toDataIdHandle();
        });
    }

    public getNumComments(): number {
        return -1; // TODO
    }
    public getComment(i: number): Promise<VideoComment> {
        return new Promise(()=>{}); // TODO
    }

    public getNumReplyVideos(): number {
        return -1; // TODO
    }
    public getReplyVideo(i: number): Promise<Video> {
        return new Promise(()=>{}); // TODO
    }

};

interface VideoInfo {
    title: string;
    description: string;
    videoFile: string;
    owner: string;
    videoReplies: SerializedDataID;
    commentReplies: SerializedDataID;
}
function isVideoInfo(x: any): x is VideoInfo {
    return  ( typeof x.title === "string"
              && typeof x.description === "string"
              && typeof x.owner === "string"
              && typeof x.videoFile === "string"
              && (typeof x.videoReplies !== "undefined" && x.videoReplies instanceof Buffer)
              && (typeof x.commentReplies !== "undefined" && x.commentReplies instanceof Buffer));
}

export async function getVideo(dataId: DataIDHandle): Promise<Video> {
    return withDropP((await safeClient.structured.fromDataIdHandle(dataId)).handleId,
                     async (viHandle: StructuredDataHandle) => {

        const vi = await viHandle.readAsObject();
        if (isVideoInfo(vi)) {
            const video: SafeFile =
                await safeClient.nfs.file.get("app", vi.videoFile);

            const mimeType = fileType(video.body).mime;
            if ($.inArray(mimeType, CONFIG.SUPPORTED_VIDEO_MIME_TYPES) !== -1) {
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
        } else {
            throw new Error("Malformed VideoInfo response.");
        }
    });
}
