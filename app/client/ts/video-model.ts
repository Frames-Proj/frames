
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

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

class UnsupportedVideoFormatError extends Error {
    constructor(mimeType: string) {
        super(`Unsupported Video Format: ${mimeType}`);
    }
}

export default class Video implements Drop {

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
        return this.videoReplies.withAt(i, did => Video.read(did));
    }
    public async getReplyVideoXorName(i: number): Promise<string> {
        return this.videoReplies.withAt(i, async did => (await did.serialise()).toString("base64"));
    }


    private constructor( data: VideoInfo
                         , file: Maybe<Promise<string>>
                         , thumbnailFile: Promise<string>
                         , commentReplies: CachedAppendableDataHandle
                         , videoReplies: CachedAppendableDataHandle) {
        this.data = data;

        this.file = file;
        this.thumbnailFile = thumbnailFile;

        this.commentReplies = commentReplies;
        this.videoReplies = videoReplies;

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
    // TODO: memoize this guy
    public xorName(): Promise<DataIDHandle> {
        return this.videoData.toDataIdHandle();
    }

    /**
     *  Construct a new video from raw parts.
     *
     * @returns a new Video. The video has not been persisted to the SAFEnet
     *  until `write` is called
     */
    public static async new(title: string, description: string, localVideoFile: string): Promise<Video> {
        return Video.makeVideo(title, description, localVideoFile);
    }

    private static async makeVideo(title: string, description: string, localVideoFile: string, parentVideoXorName?: string): Promise<Video> {

        // Ownership of these guys is going to be passed to the created video
        const commentReplies: CachedAppendableDataHandle =
            await withDropP(await sc.ad.create(title + " commentReplies"), async adh => {
                adh.save();
                return withDropP(await adh.toDataIdHandle(), did => CachedAppendableDataHandle.new(did));
            });
        const videoReplies: CachedAppendableDataHandle =
            await withDropP(await sc.ad.create(title + " videoReplies"), async adh => {
                adh.save();
                return withDropP(await adh.toDataIdHandle(), did => CachedAppendableDataHandle.new(did));
            });

        function trySave(ad: CachedAppendableDataHandle): Promise<void> {
            return ad.save().catch(err => {
                // if the appendable data already exists, ignore the error.
                // We don't need to update it.
                if ((err.res != null && err.res.statusCode === 400)
                    && (err.res != null && err.res.body != null
                        && err.res.body.errorCode === -23) ) {
                    return;
                }
                throw err;
            });
        }
        trySave(commentReplies);
        trySave(videoReplies);

        async function getXorName(handle: CachedAppendableDataHandle) {
            return withDropP(await handle.toDataIdHandle(), h => h.serialise());
        }

        const owner: string = CONFIG.getLongName().caseOf({
            just: n => n,
            nothing: () => { throw new NoUserNameError("You must choose a username."); }
        });

        const thumbnail: string = await extractThumbnail(localVideoFile);

        const payload: VideoInfo = {
            title: title,
            description: description,
            owner: owner,
            videoFile: `${CONFIG.SAFENET_VIDEO_DIR}/${title}`,
            thumbnailFile: `${CONFIG.SAFENET_THUMBNAIL_DIR}/${title}`,
            videoReplies: await getXorName(videoReplies),
            commentReplies: await getXorName(commentReplies)
        };
        if (parentVideoXorName != null) {
            payload.parentVideoXorName = parentVideoXorName;
        }

        const v = new Video(payload, Maybe.just(Promise.resolve(localVideoFile)),
                            Promise.resolve(thumbnail), commentReplies, videoReplies);
        v.setVideoData(await v.write());
        return v;
    }

    // @returns a promise for a dataID pointing to the written video meta-node
    private async write(): Promise<StructuredDataHandle> {
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

    public static async readFromStringXorName(xorName: string, fetchFile = true): Promise<Video> {
        return withDropP(await sc.dataID.deserialise(
            Buffer.from(xorName, "base64")), n => Video.read(n, fetchFile));
    }

    public static async read(dataId: DataIDHandle, fetchFile = true): Promise<Video> {
        const sdH: StructuredDataHandle =
            (await sc.structured.fromDataIdHandle(dataId)).handleId;

        const vis = await sdH.readAsObject();
        if (!isVideoInfoStringy(vis))
            throw new Error("Malformed VideoInfo response.");

        const vi: VideoInfo = toVI(vis);

        const videoReplies: CachedAppendableDataHandle =
            await CachedAppendableDataHandle.new(await sc.dataID.deserialise(vi.videoReplies));
        const commentReplies: CachedAppendableDataHandle =
            await CachedAppendableDataHandle.new(await sc.dataID.deserialise(vi.commentReplies));

        async function fileExists(file: string): Promise<boolean> {
            return new Promise<boolean>((resolve, reject) => fs.exists(file, resolve));
        }

        const localVideoFile: string = `${CONFIG.APP_VIDEO_DIR}/${vi.title}`;
        let videoFile: Maybe<Promise<string>>;
        if (await fileExists(localVideoFile)) {
            videoFile = Maybe.just(Promise.resolve(localVideoFile));
        } else if (fetchFile) {
            // TODO(ethan): this call should be going through the DNS API
            // once support for that lands.
            const video: SafeFile = await sc.nfs.file.get("app", vi.videoFile);

            const mimeType = fileType(video.body).mime;
            if (CONFIG.SUPPORTED_VIDEO_MIME_TYPES.indexOf(mimeType) === -1) {
                throw new UnsupportedVideoFormatError(mimeType);
            }

            videoFile = Maybe.just(new Promise((resolve, reject) => {
                fs.writeFile(localVideoFile, video.body, (err) => {
                    if (err) reject(err);
                    else resolve(localVideoFile);
                });
            }));
        } else {
            videoFile = Maybe.nothing<Promise<string>>();
        }

        const localThumbnailFile: string = `${CONFIG.APP_THUMBNAIL_DIR}/${vi.title}`;
        let thumbNailFile: Promise<string>;
        if (await fileExists(localThumbnailFile)) {
            thumbNailFile = Promise.resolve(localThumbnailFile);
        } else {
            thumbNailFile =
                sc.nfs.file.get("app", vi.thumbnailFile).then((thumbnail: SafeFile) => {
                    return new Promise<string>((resolve, reject) => {
                        fs.writeFile(localThumbnailFile, thumbnail.body, (err) => {
                            if (err) reject(err);
                            else resolve(localThumbnailFile);
                        });
                    });
                });
        }

        const v = new Video(vi, videoFile, thumbNailFile, commentReplies, videoReplies);
        v.setVideoData(sdH);
        return v;
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

        const videoPromise = Video.makeVideo(title, description, videoFile, thisXorName);
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
interface VideoInfoStringy extends VideoInfoBase {
    videoReplies: string; // base64 encoded
    commentReplies: string; // base64 encoded
    parentVideoXorName?: string; // base64 encoded
}
function isVideoInfoStringy(x: any): x is VideoInfoStringy {
    return (x != null
            && typeof x.videoReplies === "string"
            && typeof x.commentReplies === "string") && isVideoInfoBase(x);
}
function toVI(vi: VideoInfoStringy): VideoInfo {
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
        thumbnailFile: vi.thumbnailFile,
        videoReplies: vi.videoReplies.toString("base64"),
        commentReplies: vi.commentReplies.toString("base64")
    };
    if (vi.parentVideoXorName) ret.parentVideoXorName = vi.parentVideoXorName;
    return ret;
}
function isVideoInfo(x: any): x is VideoInfo {
    return (x != null
            && x.videoReplies instanceof Buffer
            && x.commentReplies instanceof Buffer)
            && isVideoInfoBase(x);
}
