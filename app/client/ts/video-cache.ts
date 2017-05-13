//
// This module implements the details of maintaining a cache of downloaded videos
// on disk. Basically, it's just keeps a JSON list where each element contains info
// about a particular cached video.
//

import Video from "./video-model";
import { VideoInfoStringy, VideoInfo, isVideoInfo,
         toVI, isVideoInfoStringy, UnsupportedVideoFormatError } from "./video-model";
import * as fs from "fs";

import Config from "./global-config";
const CONFIG = Config.getInstance();
import CachedAppendableDataHandle from "./cached-appendable-data";
import { withDropP, StructuredDataHandle, DataIDHandle, SafeFile } from "safe-launcher-client";
import { safeClient as sc, NoUserNameError } from "./util";
import extractThumbnail from "./thumbnail";
import { Maybe } from "./maybe";
import * as fileType from "file-type";

const MANIFEST_FILE = "cache-manifest.dat";

// All the info required to construct a video. The pointers to the
// video and comment replies live in the payload.
interface CachedVideoInfoStringy {
    xorName: string; // base64 encoded name of the video node on the SafeNET
    payload: VideoInfoStringy;
    file: string; // path to the video file on the local system
    thumbnailFile: string;
}

interface VideoCache {
    [xorName: string]: CachedVideoInfoStringy;
}

//
// This class contains the factory methods: `new` and `read` which
// used to be static methods on the `Video` class
//
//
export class VideoFactory {
    static INSTNACE: Promise<VideoFactory> = null;

    constructor(private cachedVideos: VideoCache) {}

    public new(title: string, description: string, localVideoFile: string): Promise<Video> {
        return this.makeVideo(title, description, localVideoFile);
    }
    private async makeVideo(title: string, description: string, localVideoFile: string, parentVideoXorName?: string): Promise<Video> {

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
        v._setVideoData(await v._write());
        return v;
    }

    public async readFromStringXorName(xorName: string, fetchFile = true): Promise<Video> {
        return withDropP(await sc.dataID.deserialise(
            Buffer.from(xorName, "base64")), n => Video.read(n, fetchFile));
    }
    public async read(dataId: DataIDHandle, fetchFile = true): Promise<Video> {
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
        v._setVideoData(sdH);
        return v;
    }

    static getInstance(): Promise<VideoFactory> {
        if (this.INSTNACE === null) {
            this.INSTNACE = this.newVideoFactory();
        }
        return this.INSTNACE;
    }

    private static newVideoFactory(): Promise<VideoFactory> {
        return new Promise((resolve, reject) => {
            fs.readFile(`${CONFIG.APP_HOME_DIR}/${MANIFEST_FILE}`, (err, contents) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        resolve(new VideoFactory({}));
                    } else {
                        reject(err);
                    }
                } else {
                    // TODO: typecheck this
                    resolve(new VideoFactory(<VideoCache>JSON.parse(contents.toString())));
                }

            });
        });
    }

}

