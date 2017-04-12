import { UserProfileData, UserProfile } from '../user-model';
import { safeClient } from '../util';
import { sleep, makeAlphaid, failDone } from './test-util';
import Config from '../global-config';

const CONFIG: Config = Config.getInstance();

let VALID_LONG_NAME: string;
const HOME_DIR: string = makeAlphaid().toLowerCase();

describe('The user profile data store', () => {
    it('can detect when no profile exists', async (done) => {
        try {
            const profile: UserProfile = await UserProfile.read('does-not-exist');
        } catch (e) {
            done();
        }
        fail();
    });

    beforeAll(async (done) => {
        VALID_LONG_NAME = makeAlphaid().toLowerCase();

        failDone(safeClient.nfs.dir.create('app', HOME_DIR, false), done);
        failDone(safeClient.dns.registerAndAddService(VALID_LONG_NAME, CONFIG.SERVICE_NAME, 'app', HOME_DIR), done);

        // can take some time for a service to be recognized- was seeing this in testing
        // https://safenetforum.org/t/problems-with-maidsafe-demo-app-unable-to-create-pages-nor-templates/7496/20
        await sleep(2000);
        done();
    }, 5000);

    it('can get the data from an existing home directory', async (done) => {
        const profile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(profile.data.uploadedVideos.length).toBe(0);
        expect(profile.data.playlists.length).toBe(0);

        const newUserData: UserProfileData = {
            playlists: ['playlist1'],
            uploadedVideos: ['video1', 'video2']
        };

        profile.data = newUserData;
        await failDone(profile.write(), done);
        const updatedProfile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(updatedProfile.data.uploadedVideos).toBe(['video1', 'video2']);
        expect(updatedProfile.data.playlists).toBe(['playlist1']);
        done();
    });
});
