
import { SafeFile, withDropP, DataIDHandle,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         SerializedDataID, AppendableDataHandle,
         Drop, AppedableDataMetadata, StructuredDataMetadata
       } from "safe-launcher-client";

import { safeClient } from "./util";
const sc = safeClient;
import * as fs from "fs";
import * as fileType from "file-type";
import * as readChunk from "read-chunk";
import * as stream from "stream";
import VideoComment from "./comment-model";
import { Maybe } from "./maybe";

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

class UnsupportedVideoFormatError extends Error {
    constructor(mimeType: string) {
        super(`Unsupported Video Format: ${mimeType}`);
    }
}

export default class Video implements Drop {

    public readonly title: string;
    public readonly description: string;
    public readonly file: Promise<string>;
    public readonly owner: string;

    // a pointer to the parent video, if there is one
    public readonly parentVideoXorName: Maybe<string>;
    public readonly commentReplies: AppendableDataHandle;
    public readonly videoReplies: AppendableDataHandle;

    private commentMetadata: Promise<AppedableDataMetadata>;
    private videoRepliesMetadata: Promise<AppedableDataMetadata>;

    private videoData: StructuredDataHandle; // the data on the network
    private metadata: Promise<StructuredDataMetadata>;


    private constructor(title: string, description: string, owner: string,
                        file: Promise<string>, commentReplies: AppendableDataHandle,
                        videoReplies: AppendableDataHandle, parentVideoXorName?: string) {
        this.title = title;
        this.description = description;
        this.owner = owner;
        this.file = file;

        this.commentReplies = commentReplies;
        this.videoReplies = videoReplies;

        this.parentVideoXorName =
            parentVideoXorName ? Maybe.just(parentVideoXorName) : Maybe.nothing<string>();

        this.commentMetadata = commentReplies.getMetadata();
        this.videoRepliesMetadata = videoReplies.getMetadata();

        this.videoData = null;
    }
    public async drop(): Promise<void> {
        await this.commentReplies.drop();
        await this.videoReplies.drop();
        await this.videoData.drop();
    }
    private setVideoData(vd: StructuredDataHandle): void {
        this.videoData = vd;
        this.metadata = vd.getMetadata();
    }
    public xorName(): Promise<DataIDHandle> {
        return this.videoData.toDataIdHandle();
    }

    /**
     *  Construct a new video from raw parts.
     *
     *  TODO: Once we have the DNS api working, this method needs to do the
     *  right thing when it comes to setting the owner field with a long name
     *  or something.
     *
     * @returns a new Video. The video has not been persisted to the SAFEnet
     *  until `write` is called
     */
    public static async new(title: string, description: string, localVideoFile: string): Promise<Video> {
        return Video.makeVideo(title, description, localVideoFile);
    }

    private static async makeVideo(title: string, description: string,
                                   localVideoFile: string, parentVideoXorName?: string): Promise<Video> {
        // Ownership of these guys is going to be passed to the created video
        const commentReplies: AppendableDataHandle =
            await sc.ad.create(title + " commentReplies");

        const videoReplies: AppendableDataHandle =
            await sc.ad.create(title + " videoReplies");

        await commentReplies.save().catch(err => {
            // if the appendable data already exists, ignore the error.
            // We don't need to update it.
            if ((err.res != null && err.res.statusCode === 400)
                && (err.res != null && err.res.body != null
                    && err.res.body.errorCode === -23) ) {
                return;
            }
            throw err;
        });

        await videoReplies.save().catch(err => {
            if ((err.res != null && err.res.statusCode === 400)
                && (err.res != null && err.res.body != null
                    && err.res.body.errorCode === -23) ) {
                return;
            }
            throw err;
        });

        const v = new Video(title, description, "TODO OWNER",
                            Promise.resolve(localVideoFile),
                            commentReplies, videoReplies, parentVideoXorName);
        v.setVideoData(await v.write());
        return v;
    }

    // @returns a promise for a dataID pointing to the written video meta-node
    private async write(): Promise<StructuredDataHandle> {

        const safeVideoFile: string = `${CONFIG.SAFENET_VIDEO_DIR}/${this.title}`;
        const localPath: string = await this.file;

        let fileSize: number = fs.statSync(localPath).size;
        let fStream: stream.Readable = fs.createReadStream(localPath);
        const mimeType: string =
            await readChunk(localPath, 0, 64).then((b: Buffer) => {
                return fileType(b).mime;
            });

        if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
            throw new UnsupportedVideoFormatError(mimeType);
        }

        await sc.nfs.file.create("app", safeVideoFile, fStream,
                                            fileSize, mimeType);

        let payload: VideoInfo = {
            title: this.title,
            description: this.description,
            owner: this.owner,
            videoFile: safeVideoFile,
            videoReplies: await (await this.videoReplies.toDataIdHandle()).serialise(),
            commentReplies: await (await this.commentReplies.toDataIdHandle()).serialise(),
        };
        this.parentVideoXorName.caseOf({
            nothing: () => null,
            just: p => payload.parentVideoXorName = p
        });

        const viH: StructuredDataHandle =
            await sc.structured.create(this.title, TYPE_TAG_VERSIONED,
                                       toVIStringy(payload));
        await viH.save();
        return viH;
    }

    public static async readFromStringXorName(xorName: string): Promise<Video> {
        return withDropP(await sc.dataID.deserialise(
            Buffer.from(xorName, "base64")), n => Video.read(n));
    }

    public static async read(dataId: DataIDHandle): Promise<Video> {
        const sdH: StructuredDataHandle =
            (await sc.structured.fromDataIdHandle(dataId)).handleId;

        const vis = await sdH.readAsObject();
        if (!isVideoInfoStringy(vis))
            throw new Error("Malformed VideoInfo response.");

        const vi: VideoInfo = toVI(vis);
        const video: SafeFile = await sc.nfs.file.get("app", vi.videoFile);

        const mimeType = fileType(video.body).mime;
        if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
            throw new UnsupportedVideoFormatError(mimeType);
        }

        const videoReplies: AppendableDataHandle =
            (await sc.ad.fromDataIdHandle(
                await sc.dataID.deserialise(vi.videoReplies))).handleId;
        const commentReplies: AppendableDataHandle =
            (await sc.ad.fromDataIdHandle(
                await sc.dataID.deserialise(vi.commentReplies))).handleId;

        const videoFile: Promise<string> = new Promise((resolve, reject) => {
            const fileLoc: string = `${CONFIG.APP_VIDEO_DIR}/${vi.title}`;
            fs.writeFile(fileLoc, video.body, (err) => {
                if (err) reject(err);
                else resolve(fileLoc);
            });
        });

        const v = new Video(vi.title, vi.description, vi.owner,
                            videoFile, commentReplies, videoReplies, vi.parentVideoXorName);
        v.setVideoData(sdH);
        return v;
    }

    public async addComment(text: string): Promise<VideoComment> {
        const comment = await VideoComment.new(
            "TODO OWNER",
            text,
            Math.floor(new Date().getTime() / 1000),
            (await this.metadata).version,
            true,
            await this.videoData.toDataIdHandle());

        await withDropP(await comment.xorName(), (n) => this.commentReplies.append(n));
        return comment;
    }

    public async addVideoReply(title: string, description: string, videoFile: string): Promise<Video> {
        const thisXorName: string =
            await withDropP(await this.xorName(), async n => (await n.serialise()).toString("base64"));

        const videoPromise = Video.makeVideo(title, description, videoFile, thisXorName);
        videoPromise.then(async video =>
                          withDropP(await video.xorName(), n => this.videoReplies.append(n)));

        return videoPromise;

    }

    public async getNumComments(): Promise<number> {
        return (await this.commentMetadata).dataLength;
    }
    public async getComment(i: number): Promise<VideoComment> {
        if (i >= await this.getNumComments() || i < 0)
            throw new Error(`Video::getComment(${i}) index not in range!`);

        return withDropP(await this.commentReplies.at(i), (di) => {
            return VideoComment.read(di);
        });
    }

    public async getNumReplyVideos(): Promise<number> {
        return (await this.videoRepliesMetadata).dataLength;
    }
    public async getReplyVideo(i: number): Promise<Video> {
        if (i >= await this.getNumReplyVideos() || i < 0)
            throw new Error(`Video::getNumReplyVideos(${i}) index not in range!`);

        return withDropP(await this.videoReplies.at(i), async (vDId) => {
            return Video.read(vDId);
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
    parentVideoXorName?: string; // base64 encoded
}
function isVideoInfoStringy(x: any): x is VideoInfoStringy {
    return (typeof x.videoReplies === "string" &&
            typeof x.commentReplies === "string") && isVideoInfoBase(x);
}
function toVI(vi: VideoInfoStringy): VideoInfo {
    let ret: VideoInfo = {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        videoReplies: Buffer.from(vi.videoReplies, "base64"),
        commentReplies: Buffer.from(vi.commentReplies, "base64")
    };
    if (vi.parentVideoXorName) ret.parentVideoXorName = vi.parentVideoXorName;

    return ret;
}
interface VideoInfo extends VideoInfoBase {
    videoReplies: SerializedDataID;
    commentReplies: SerializedDataID;
    parentVideoXorName?: string;
}
function toVIStringy(vi: VideoInfo): VideoInfoStringy {
    let ret: VideoInfoStringy = {
        title: vi.title,
        description: vi.description,
        videoFile: vi.videoFile,
        owner: vi.owner,
        videoReplies: vi.videoReplies.toString("base64"),
        commentReplies: vi.commentReplies.toString("base64")
    };
    if (vi.parentVideoXorName) ret.parentVideoXorName = vi.parentVideoXorName;
    return ret;
}
function isVideoInfo(x: any): x is VideoInfo {
    return (x.videoReplies instanceof Buffer
            && x.commentReplies instanceof Buffer)
            && isVideoInfoBase(x);
}
