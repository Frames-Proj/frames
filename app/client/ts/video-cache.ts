//
// This module implements the details of maintaining a cache of downloaded videos
// on disk. Basically, it's just keeps a JSON list where each element contains info
// about a particular cached video.
//

import Video from "./video-model";
import { VideoInfoStringy, VideoInfo, isVideoInfo,
         toVI, toVIStringy, isVideoInfoStringy,
         UnsupportedVideoFormatError } from "./video-model";
import * as fs from "fs";

import Config from "./global-config";
const CONFIG = Config.getInstance();
import CachedAppendableDataHandle from "./cached-appendable-data";
import { withDropP, StructuredDataHandle, DataIDHandle, SafeFile } from "safe-launcher-client";
import { safeClient as sc, NoUserNameError } from "./util";
import extractThumbnail from "./thumbnail";
import { Maybe } from "./maybe";
import * as fileType from "file-type";
import { currentUserProfile, UserProfile } from "./user-model";

// All the info required to construct a video. The pointers to the
// video and comment replies live in the payload.
export interface CachedVideoInfoStringy {
    xorName: string; // base64 encoded name of the video node on the SafeNET
    payload: VideoInfoStringy;
    file: string; // path to the video file on the local system
    thumbnailFile: string;
    timestamp: number; // seconds since unix epoch indicating when the video was last touched
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
    // @friend-class Video

    static INSTNACE: Promise<VideoFactory> = null;

    constructor(private cachedVideos: VideoCache) {}

    public new(title: string, description: string, localVideoFile: string): Promise<Video> {
        return this._makeVideo(title, description, localVideoFile);
    }
    public async _makeVideo(title: string, description: string, localVideoFile: string, parentVideoXorName?: string): Promise<Video> {

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
                            Promise.resolve(thumbnail), commentReplies, videoReplies, this);
        v._setVideoData(await v._write());
        const cachedVidInfo: CachedVideoInfoStringy =
            (await (mkCachedVideo(v, toVIStringy(payload)))).valueOr(null);
        if (cachedVidInfo !== null)
            await this._addVideo(cachedVidInfo);
        await currentUserProfile.caseOf({
            nothing: () => { throw new Error("video-cache.ts:VideoFactory:makeVideo impossible"); },
            just: async prof => {
                const p: UserProfile = await prof;
                p.uploadVideo(cachedVidInfo.xorName);
                p.write();
            }
        });
        return v;
    }

    public async readFromStringXorName(xorName: string, fetchFile = true): Promise<Video> {
        return withDropP(await sc.dataID.deserialise(
            Buffer.from(xorName, "base64")), n => this.read(n, fetchFile));
    }
    public async read(dataId: DataIDHandle, fetchFile = true): Promise<Video> {
        const strXorName: string = (await dataId.serialise()).toString("base64");
        if (strXorName in this.cachedVideos) {
            return this.getCachedVideo(this.cachedVideos[strXorName]);
        }

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

        const v = new Video(vi, videoFile, thumbNailFile, commentReplies, videoReplies, this);
        v._setVideoData(sdH);
        await (await mkCachedVideo(v, vis)).caseOf({
            nothing: () => Promise.resolve(null),
            just: cv => this._addVideo(cv)
        });
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
            fs.readFile(CONFIG.CACHE_MANIFEST_FILE, (err, contents) => {
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

    private async getCachedVideo(blob: CachedVideoInfoStringy): Promise<Video> {
        const videoReplies: CachedAppendableDataHandle =
            await CachedAppendableDataHandle.new(await sc.dataID.deserialise(
                new Buffer(blob.payload.videoReplies, "base64")));
        const commentReplies: CachedAppendableDataHandle =
            await CachedAppendableDataHandle.new(await sc.dataID.deserialise(
                new Buffer(blob.payload.commentReplies, "base64")));

        const v: Video = new Video(toVI(blob.payload),
                                Maybe.just(Promise.resolve(blob.file)),
                                Promise.resolve(blob.thumbnailFile),
                                commentReplies,
                                videoReplies,
                                this
                                );
        const vd: StructuredDataHandle =
            await withDropP(await sc.dataID.deserialise(new Buffer(blob.xorName, "base64")), async did => {
                return (await sc.structured.fromDataIdHandle(did)).handleId;
            });
        v._setVideoData(vd);
        return v;
    }

    // private, but exposed for unit testing the tricky cache logic only
    // @idempotent
    public async _addVideo(v: CachedVideoInfoStringy): Promise<void> {
        let p: Promise<void> = Promise.resolve();
        // if we have overflowed the max cache size, clear the bottom
        // half of the cache
        if (Object.keys(this.cachedVideos).length > CONFIG.MAX_CACHE_SIZE) {
            p = p.then(_ => this.compactCache());
        }

        if (!(v.xorName in this.cachedVideos)) {
            this.cachedVideos[v.xorName] = v;
        }
        return p;
    }

    // expose a mechanism to manually invalidate a video.
    // this is mostly useful for tests.
    public _invalidate(xorName: string): Promise<void> {
        if (!(xorName in this.cachedVideos)) return;

        const vi: CachedVideoInfoStringy = this.cachedVideos[xorName];
        delete this.cachedVideos[xorName];
        return Promise.all([this.writeCacheManifest(), this.rmVideoFiles(vi)]).then(_ => null);
    }

    private writeCacheManifest(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(CONFIG.CACHE_MANIFEST_FILE,
                         JSON.stringify(this.cachedVideos), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private async compactCache(): Promise<void> {
        const tgtCacheNum = CONFIG.MAX_CACHE_SIZE / 2;

        const keepList = Object.keys(this.cachedVideos)
            .map(k => this.cachedVideos[k])
            .sort((lhs, rhs) => rhs.timestamp - lhs.timestamp)
            .slice(0, Math.floor(CONFIG.MAX_CACHE_SIZE / 2))
            .reduce((acc, vi) => {
                acc[vi.xorName] = vi;
                return acc;
            }, {});

        let removePromises: Promise<void>[] = [];
        for (let vid in this.cachedVideos) {
            if (vid in keepList) continue;
            removePromises.push(this.rmVideoFiles(this.cachedVideos[vid]));
        }
        await Promise.all(removePromises);
        this.cachedVideos = keepList;
        return this.writeCacheManifest();
    }

    private rmVideoFiles(vi: CachedVideoInfoStringy): Promise<void> {
        return Promise.all([
            new Promise<void>((resolve, reject) => {
                    if (vi.file.startsWith(CONFIG.APP_HOME_DIR)) {
                        fs.unlink(vi.file, (err) => {
                            if (err)
                                if (err.code === "ENOENT") resolve();
                                else reject(err);
                            else resolve();
                        });
                    } else {
                        resolve();
                    }
            }),
            new Promise<void>((resolve, reject) => {
                if (vi.thumbnailFile.startsWith(CONFIG.APP_HOME_DIR)) {
                    fs.unlink(vi.thumbnailFile, (err) => {
                        if (err)
                            if (err.code === "ENOENT") resolve();
                            else reject(err);
                        else resolve();
                    });
                } else {
                    resolve();
                }
            })
        ]).then(_ => null );
    }

}

async function mkCachedVideo(v: Video, payload: VideoInfoStringy): Promise<Maybe<CachedVideoInfoStringy>> {
    // this just flips the monads and unpacks the promise (which is now the outer monad)
    const file: Maybe<string> = await v.file.caseOf({
        just: async fp => Promise.resolve(Maybe.just<string>(await fp)),
        nothing: () => Promise.resolve(Maybe.nothing<string>())
    });
    const xorName = await v.stringXorName();
    const tf = await v.thumbnailFile;

    return file.bind(f => Maybe.just<CachedVideoInfoStringy>({
        xorName: xorName,
        payload: payload,
        file: f,
        thumbnailFile: tf,
        timestamp: new Date().getTime() / 1000
    }));
}



