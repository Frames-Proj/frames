

//
// Despite singletons usually being an anti-pattern, they are still useful
// for global *immutable* state which we need to initialize at some point.
//
import { InstantiationError } from "./error";
import { AuthorizationPayload } from "safe-launcher-client";


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
    public readonly SAFENET_VIDEO_DIR: string = "videos";
    public readonly APP_NAME: string = "Frames";

    private CURRENT_LONG_NAME: string = "Guest";
    public getLongName(): string {
        return this.CURRENT_LONG_NAME;
    }
    public setLongName(longName : string): void {
        this.CURRENT_LONG_NAME = longName;
    }

    public readonly SUPPORTED_VIDEO_MIME_TYPES = ["video/mp4"];

    public readonly APP_ID: string = "todo.get.actual.domain";
    public readonly APP_VERSION: string = "0.0.1";
    public readonly APP_VENDOR: string = "Safety in Numbers";
    public readonly APP_PERMISSIONS: string[] = [ "SAFE_DRIVE_ACCESS", "LOW_LEVEL_API"];
    public readonly SAFE_LAUNCHER_ENDPOINT: string = "http://localhost:8100";
    public readonly SERVICE_NAME: string = this.APP_NAME;

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
