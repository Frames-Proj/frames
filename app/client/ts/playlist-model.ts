
import { SafeFile, withDropP, DataIDHandle,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         SerializedDataID, AppendableDataHandle,
         Drop, AppedableDataMetadata, StructuredDataMetadata,
         FromDataIDHandleResponse
       } from "safe-launcher-client";

import { safeClient } from "./util";
const sc = safeClient;

import Video from "./video-model";

//
// The playlist class will be stored in a structured data with
// an attached appendable data
// on the network. Once MaidSafe adds support for updating
// a file, it could make more sense to just use a file
// to store things.
//
// For now, playlists don't allow for reordering, but a
// workaround for the future is to allow playlist members
// to be either videos or reorder nodes. There would have
// to be a little structural checking to see which one is
// which. Reorder nodes can provide a mapping from node
// indexes as they actually appear in the appendable data
// to the index at which they should appear in the new data.
//
// TODO: what are the right ownership semantics here? Should
// a playlist own its videos?
export default class Playlist implements Drop {
    private m_videos: Video[];
    public get videos() { return this.m_videos; }

    public readonly networkList: AppendableDataHandle;
    private networkInfo: StructuredDataHandle;

    public readonly title;
    public readonly description;
    public readonly owner;

    private constructor(vs: Video[],
                networkList: AppendableDataHandle,
                title: string,
                description: string,
                owner: string
               ) {
        this.m_videos = vs;
        this.networkList = networkList;

        this.title = title;
        this.description = description;
        this.owner = owner;
    }
    // this must be called after the constructor
    private setNetworkInfo(networkInfo: StructuredDataHandle): void {
        this.networkInfo = networkInfo;
    }

    public async drop() {
        await this.networkList.drop();
        await this.networkInfo.drop();
    }

    public static async read(xorName: DataIDHandle): Promise<Playlist> {
        // get the info blob
        const sdH: StructuredDataHandle =
           (await sc.structured.fromDataIdHandle(xorName)).handleId;
        const liS = await sdH.readAsObject();
        if (!isPlaylistInfoStringy(liS))
            throw new Error("Malformed PlaylistInfo response.");
        const pi: PlaylistInfo = toPI(liS);

        // get the actual list of videos
        const networkVideoListMD: FromDataIDHandleResponse =
            await withDropP(await sc.dataID.deserialise(pi.videos),
                            did => sc.ad.fromDataIdHandle(did));
        const networkVideoList = networkVideoListMD.handleId;

        // NOTE: this loads all the videos. Is that too slow?
        let videos: Video[] = [];
        for (let i = 0; i < networkVideoListMD.dataLength; ++i) {
            videos.push(await Video.read(await networkVideoList.at(i)));
        }

        let p = new Playlist(videos, networkVideoList, pi.title, pi.description, pi.owner);
        p.setNetworkInfo(sdH);
        return p;
    }

    public static async new(title: string, description: string): Promise<Playlist> {
        const videoList: AppendableDataHandle = await sc.ad.create(title + " videos");
        await videoList.save();
        let p = new Playlist([], videoList, title, description, "TODO OWNER");
        p.setNetworkInfo(await p.write());
        return p;
    }

    // helper function for this.new()
    private async write(): Promise<StructuredDataHandle> {
        const info: PlaylistInfoStringy = toPIStringy({
            title: this.title,
            description: this.description,
            owner: this.owner,
            videos: await withDropP(await this.networkList.toDataIdHandle(), di => di.serialise())
        });
        const piS = await sc.structured.create(this.title, TYPE_TAG_VERSIONED, info);
        await piS.save();
        return piS;
    }

    public async append(video: Video): Promise<void> {
        this.m_videos.push(video);
        await withDropP(await video.xorName, di => this.networkList.append(di));
    }

    public xorName(): Promise<DataIDHandle> {
        return this.networkInfo.toDataIdHandle();
    }
}

//
// Playlist info boilerplate
//
interface PlaylistInfoBase {
    title: string;
    description: string;
    owner: string;
}
function isPlaylistInfoBase(x: any): x is PlaylistInfoBase {
    return  ( x != null && typeof x.title === "string"
              && typeof x.description === "string"
              && typeof x.owner === "string");
}
interface PlaylistInfoStringy extends PlaylistInfoBase {
    videos: string; // base64 encoded
}
function isPlaylistInfoStringy(x: any): x is PlaylistInfoStringy {
    return (x != null && typeof x.videos === "string") && isPlaylistInfoBase(x);
}
function toPI(vi: PlaylistInfoStringy): PlaylistInfo {
    return {
        title: vi.title,
        description: vi.description,
        owner: vi.owner,
        videos: Buffer.from(vi.videos, "base64"),
    };
}
interface PlaylistInfo extends PlaylistInfoBase {
    videos: SerializedDataID; // a pointer to the videos appendable data
}
function isVideoInfo(x: any): x is PlaylistInfo {
    return x.videos instanceof Buffer && isPlaylistInfoBase(x);
}
function toPIStringy(vi: PlaylistInfo): PlaylistInfoStringy {
    return {
        title: vi.title,
        description: vi.description,
        owner: vi.owner,
        videos: vi.videos.toString("base64")
    };
}
