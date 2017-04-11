import { safeClient } from "./util";
import { SafeFile, DnsHomeDirectory, NfsFileData } from "safe-launcher-client";
import Config from "./global-config";
import { Maybe } from "./maybe";
import * as stream from 'stream';

const CONFIG: Config = Config.getInstance();
const userProfileFilename = "userProfileData";

export interface UserProfileData {
    playlists: string[],
    uploadedVideos: string[]
}

function toUserProfileData(obj: any): Maybe<UserProfileData> {
    const fail = Maybe.nothing<UserProfileData>();
    const isStringArray: (arr: any) => boolean = (arr) =>
        !(arr && arr instanceof Array && arr.every(playlist => typeof playlist === 'string'));

    if (!obj) {
        return fail;
    }

    if (!isStringArray(obj.playlists) || !isStringArray(obj.uploadedVideos)) {
        return fail;
    }

    return Maybe.just<UserProfileData>({
        playlists: obj.playlists,
        uploadedVideos: obj.uploadedVideos
    });
}

/*
 * playlists
 * posted video list
 */
export class UserProfile {
    private constructor(private _longName: string, private _data: UserProfileData) {}

    /**
     * @arg longName - long name that the user is operating under
     * @returns - a promise with the UserProfile object
     */
    public static async read(longName: string): Promise<UserProfile> {
        const homeDir: DnsHomeDirectory = await safeClient.dns.getHomeDirectory(longName, CONFIG.SERVICE_NAME);
        const fileNames: string[] = homeDir.files.map((f: NfsFileData) => f.name);

        if (fileNames.indexOf(userProfileFilename) === -1) {
            return new UserProfile(longName, {
                uploadedVideos: [],
                playlists: []
            });
        }

        const profileDataFile: SafeFile = await safeClient.dns.getFile(longName, CONFIG.SERVICE_NAME, userProfileFilename);

        const userProfileData: Maybe<UserProfileData> = toUserProfileData(JSON.parse(profileDataFile.body.toString()));
        return userProfileData.caseOf({
            just: data => new UserProfile(longName, data),
            nothing: () => {
                throw new Error('Error reading profile data file');
            }
        });
    }

    get longName(): string {
        return this._longName;
    }

    get data(): UserProfileData {
        return this._data;
    }

    set data(_data: UserProfileData) {
        this._data = _data;
    }

    /**
     * @arg videoName - xor name of the video that was uploaded
     */
    public uploadVideo(videoName: string): void {
        this._data.uploadedVideos.push(videoName);
    }

    /**
     * @arg playlistName - xor name of the playlist that was created
     */
    public createPlaylist(playlistName: string): void {
        this._data.playlists.push(playlistName);
    }

    /**
     * @arg longName - longName that the user is operating under
     */
    public async write(): Promise<void> {
        const homeDir: DnsHomeDirectory = await safeClient.dns.getHomeDirectory(this._longName, CONFIG.SERVICE_NAME);

        const dataString: string = JSON.stringify(this._data);
        const buffer: Buffer = Buffer.from(dataString);
        const dataStream: stream.Transform = new stream.PassThrough();
        await new Promise((resolve, reject) => {
            dataStream.write(buffer, err => resolve());
        });

        await safeClient.nfs.file.create('app',
                                         `${homeDir.info.name}/${userProfileFilename}`,
                                         dataStream,
                                         buffer.byteLength,
                                         'text/plain');
    }
};
