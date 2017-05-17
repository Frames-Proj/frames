import { recursiveRmdir } from "../util";
import { idempotentMkdirSync, makeid } from "./test-util";
import * as fs from "fs";

describe("recursiveRmdir", () => {
    fit("can remove a directory", async done => {
        const testDir: string = makeid();

        idempotentMkdirSync("/tmp/frames-test");
        fs.mkdirSync(`/tmp/frames-test/${testDir}`);
        await recursiveRmdir(`/tmp/frames-test/${testDir}`);

        done();
    });

    fit("can remove a file in that directory", async done => {
        const testDir: string = makeid();

        idempotentMkdirSync("/tmp/frames-test");
        fs.mkdirSync(`/tmp/frames-test/${testDir}`);
        fs.closeSync(fs.openSync(`/tmp/frames-test/${testDir}/${makeid()}`, `w`));
        await recursiveRmdir(`/tmp/frames-test/${testDir}`)

        done();
    });
    fit("can recursively remove a directory", async done => {
        const testDir: string = makeid();
        const testSubDir: string = makeid();

        idempotentMkdirSync("/tmp/frames-test");
        fs.mkdirSync(`/tmp/frames-test/${testDir}`);
        fs.mkdirSync(`/tmp/frames-test/${testDir}/${testSubDir}`);
        fs.mkdirSync(`/tmp/frames-test/${testDir}/${makeid()}`);
        fs.closeSync(fs.openSync(`/tmp/frames-test/${testDir}/${testSubDir}/${makeid()}`, `w`));
        fs.closeSync(fs.openSync(`/tmp/frames-test/${testDir}/${testSubDir}/${makeid()}`, `w`));
        fs.mkdirSync(`/tmp/frames-test/${testDir}/${testSubDir}/${makeid()}`);
        fs.mkdirSync(`/tmp/frames-test/${testDir}/${testSubDir}/${makeid()}`);

        await recursiveRmdir(`/tmp/frames-test/${testDir}`);

        done();
    });
});
