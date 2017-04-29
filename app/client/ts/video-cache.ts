import Video from "./video-model";
import Config from "./global-config";
import * as stream from "stream";
import { Maybe } from "./maybe";
import { safeClient } from "./util";
import { SafeFile, DnsHomeDirectory, NfsFileData } from "safe-launcher-client";

const CONFIG: Config = Config.getInstance();

interface Cache {
    [xorName: string]: {
        video: Video,
        accessTime: Date
    }
}

type CacheStateStringy = {
    xorName: string;
    name: string;
}

export default class VideoCache {
    private static readonly CACHE_STATE_FILENAME = 'cachestate';
    private static INSTANCES: {
        [longName: string]: VideoCache
    } = {};

    private cache: Cache;
    private numEntries: number;

    private constructor(private longName: string, oldState: Maybe<CacheStateStringy>) {
        oldState.caseOf({
            nothing: () => {
                this.cache = {};
                this.numEntries = 0;
            },
            just: (state: CacheStateStringy) => {
                this.cache = {};
                this.numEntries = Infinity;
            }
        });
    }

    static async getInstance(longName: string) {
        if (VideoCache.INSTANCES[longName] == null) {
            VideoCache.INSTANCES[longName] = new VideoCache(longName, await VideoCache.readFromDisk(longName));
        }
        return VideoCache.INSTANCES[longName];
    }

    private garbageCollect(): void {
        // sort by oldest first
        const oldKeys: string[] = Object.keys(this.cache).sort((key1: string, key2: string) => {
            if (this.cache[key1].accessTime < this.cache[key2].accessTime) return -1;
            else if (this.cache[key1].accessTime > this.cache[key2].accessTime) return 1;
            else return 0;
        });

        // delete half of the oldest cache entries
        for (let i = 0; i < oldKeys.length / 2; i++) {
            delete this.cache[oldKeys[i]];
        }
        this.numEntries = Object.keys(this.cache).length;
    }

    async getFromXorName(xorName: string): Promise<Video> {
        if (this.cache[xorName] == null) {
            if (this.numEntries + 1 > CONFIG.MAX_CACHE_SIZE) {
                this.garbageCollect();
            }

            this.cache[xorName] = {
                video: await Video.readFromStringXorName(xorName),
                accessTime: new Date()
            };
            this.numEntries += 1;
        } else {
            this.cache[xorName].accessTime = new Date();
        }

        console.log('cache state:', this.cache);
        return this.cache[xorName].video;
    }

    stateToString(): string {
        //const ret = Object.keys(this.cache).map((xorName: string) => return {
        return JSON.stringify({
            xorName: '',
            name: ''
        });
    }

    private static async readFromDisk(longName): Promise<Maybe<CacheStateStringy>> {
        const homeDir: DnsHomeDirectory = await safeClient.dns.getHomeDirectory(longName, CONFIG.SERVICE_NAME);
        const fileNames: string[] = homeDir.files.map((f: NfsFileData) => f.name);

        if (fileNames.indexOf(VideoCache.CACHE_STATE_FILENAME) === -1) {
            return Maybe.nothing<CacheStateStringy>();
        }

        const dataFile: SafeFile = await safeClient.dns.getFile(longName, CONFIG.SERVICE_NAME, VideoCache.CACHE_STATE_FILENAME);
        return Maybe.just<CacheStateStringy>(JSON.parse(dataFile.body.toString()));
    }

    async persistOnDisk() {
        const homeDir: DnsHomeDirectory = await safeClient.dns.getHomeDirectory(this.longName, CONFIG.SERVICE_NAME);

        const buffer: Buffer = Buffer.from(this.stateToString());
        const dataStream: stream.Transform = new stream.PassThrough();
        await new Promise((res, rej) => {
            dataStream.write(buffer, err => res());
        });

        await safeClient.nfs.file.create("app",
                                         `${homeDir.info.name}/${VideoCache.CACHE_STATE_FILENAME}`,
                                         dataStream,
                                         buffer.byteLength,
                                         "text/plain");
    }

    invalidateCache() {
        this.cache = {};
        this.numEntries = 0;
    }
}
