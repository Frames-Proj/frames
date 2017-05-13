import { UserProfileData, UserProfile } from "../user-model";
import { safeClient } from "../util";
import { sleep, makeAlphaid, failDone, setupTestEnv } from "./test-util";
import Config from "../global-config";

const CONFIG: Config = Config.getInstance();

let VALID_LONG_NAME: string;
const HOME_DIR: string = makeAlphaid().toLowerCase();

// TODO(ethan): this might not be needed anymore
describe("The user profile data store", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    beforeAll(async (done) => {



        VALID_LONG_NAME = makeAlphaid().toLowerCase();

        await failDone(safeClient.nfs.dir.create("app", HOME_DIR, false), done);
        await failDone(safeClient.dns.registerAndAddService(
            VALID_LONG_NAME, CONFIG.SERVICE_NAME, "app", HOME_DIR), done);

        done();
    });

    it("can detect when no profile exists", async (done) => {
        try {
            const profile: UserProfile = await UserProfile.read("does-not-exist");
        } catch (e) {
            done();
            return;
        }
        fail();
    });

    it("can get the data from an existing home directory", async (done) => {
        const profile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(profile.data.uploadedVideos.length).toBe(0);
        expect(profile.data.playlists.length).toBe(0);

        const newUserData: UserProfileData = {
            playlists: ["playlist1"],
            uploadedVideos: ["video1", "video2"]
        };

        profile.data = newUserData;
        await failDone(profile.write(), done);
        const updatedProfile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(updatedProfile.data.uploadedVideos).toEqual(["video1", "video2"]);
        expect(updatedProfile.data.playlists).toEqual(["playlist1"]);
        done();
    });
});
