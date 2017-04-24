
import extractThumbnail from "../thumbnail";
import { TEST_DATA_DIR } from "./test-util";
import { exec } from "child_process";
import * as fs from "fs";
import { makeid } from "./test-util";

describe("getThumbnail", () => {
    it("can get a thumbnail image for an mp4 on node", (done) => {
        extractThumbnail(`${TEST_DATA_DIR}/test-vid.mp4`).then(thumbnail => {
            exec(`file ${thumbnail}`, (err, stdout, stderr) => {
                expect(err).toBeNull();
                expect(/PNG image data/.test(stdout)).toBeTruthy();
                done();
            });
        });
    });
});

