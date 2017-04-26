import Video from "./video-model";
import Config from "./global-config";

const CONFIG: Config = Config.getInstance();

interface Cache {
    [xorName: string]: {
        video: Video,
        accessTime: Date
    }
}

export default class VideoCache {
    private static INSTANCE: VideoCache = null;
    private cache: Cache;
    private numEntries: number;

    private constructor() {
        this.cache = {};
        this.numEntries = 0;
    }

    static getInstance() {
        if (VideoCache.INSTANCE == null) {
            VideoCache.INSTANCE = new VideoCache();
        }
        return VideoCache.INSTANCE;
    }

    async getFromXorName(xorName: string): Promise<Video> {
        if (this.cache[xorName] == null) {
            if (this.numEntries + 1 > CONFIG.MAX_CACHE_SIZE) {

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

            this.cache[xorName] = {
                video: await Video.readFromStringXorName(xorName),
                accessTime: new Date()
            };
            this.numEntries += 1;
        } else {
            this.cache[xorName].accessTime = new Date();
        }

        return this.cache[xorName].video;
    }

    invalidateCache() {
        this.cache = {};
        this.numEntries = 0;
    }
}
