

//
// Despite singletons usually being an anti-pattern, they are still useful
// for global *immutable* state which we need to initialize at some point.
//
import { InstantiationError } from "./error";
import { AuthorizationPayload } from "safe-launcher-client";
import { Maybe } from "./maybe";


export default class Config {
    // Contains global immutable state about our app. This is where we should stuff
    // all the config vars. Config member vars should be in SCREAMING_SNAKE_CASE.


    private static _instance: Config = new Config();

    constructor() {
        if (Config._instance) {
            throw new InstantiationError("Config");
        }

        // Here is where we would parse an *rc file if we want to support
        // that in the future

        Config._instance = this;
    }

    public static getInstance(): Config { return Config._instance; }

    public readonly APP_HOME_DIR: string = "/tmp/frames-home";
    public readonly APP_VIDEO_DIR: string = this.APP_HOME_DIR + "/video-cache";
    public readonly APP_THUMBNAIL_DIR: string = this.APP_HOME_DIR + "/thumbnail-cache";
    public readonly SAFENET_VIDEO_DIR: string = "videos";
    public readonly SAFENET_THUMBNAIL_DIR: string = "thumbnails";
    public readonly APP_NAME: string = "Frames";

    // long name stuff. We thought we would avoid global state...
    private CURRENT_LONG_NAME: Maybe<string> = Maybe.nothing<string>();
    private longNameListeners: ((ln: Maybe<string>) => any)[] = [];
    public getLongName(): Maybe<string> {
        return this.CURRENT_LONG_NAME;
    }
    public setLongName(longName: Maybe<string>): void {
        this.CURRENT_LONG_NAME = longName;
        for (let i = 0; i < this.longNameListeners.length; ++i) {
            this.longNameListeners[i](longName);
        }
    }
    public addLongNameChangeListener(f: (ln: Maybe<string>) => any): void {
        this.longNameListeners.push(f);
    }

    public readonly SUPPORTED_VIDEO_MIME_TYPES = ["video/mp4"];

    public readonly APP_ID: string = "todo.get.actual.domain";
    public readonly APP_VERSION: string = "0.0.1";
    public readonly APP_VENDOR: string = "Safety in Numbers";
    public readonly APP_PERMISSIONS: string[] = [ "SAFE_DRIVE_ACCESS", "LOW_LEVEL_API"];
    public readonly SAFE_LAUNCHER_ENDPOINT: string = "http://localhost:8100";
    public readonly SERVICE_NAME: string = this.APP_NAME.toLowerCase();
    public readonly SERVICE_HOME_DIR: string = "frameshome";
    public readonly MAX_CACHE_SIZE: number = 1000;

    public makeAuthPayload(): AuthorizationPayload {
        return {
            "app": {
                "name": this.APP_NAME,
                "id": this.APP_ID,
                "version": this.APP_VERSION,
                "vendor": this.APP_VENDOR,
            },
            "permissions": this.APP_PERMISSIONS
        };
    }
}
