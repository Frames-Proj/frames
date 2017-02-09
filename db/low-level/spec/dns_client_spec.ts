
import { makeid, client, TEST_DATA_DIR, exists, failDone, makeAlphaid } from "./test_util";
import { AuthorizationPayload } from "../src/ts/auth";
import { DnsClient, DnsServiceList, DnsHomeDirectory, DnsLongNameList } from "../src/ts/dns";
import { SafeFile, RootPath } from "../src/ts/nfs";
import * as stream from "stream";
import * as fs from "fs";


describe("An dns client", () => {

    it("can register a longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.register(longName), done);
        done();
    });

    it("can register a longName and service", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);
        done();
    });

    it("can list the services mapped to a longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        const expectedServices: DnsServiceList = ["www"];

        const services: DnsServiceList = await client.dns.getServices(longName);
        expect(expectedServices).toEqual(services);
        done();
    });

    it("can map a service to an existing longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        await failDone(client.dns.addService(longName, "zzz", "app", "/"), done);
        const expectedServices: DnsServiceList = ["zzz", "www"];

        const services: DnsServiceList = await client.dns.getServices(longName);
        expect(expectedServices.sort()).toEqual(services.sort());
        done();
    });

    it("can fetch a home directory associated with a service", async (done) => {
        const longName: string = makeAlphaid();
        const dir: string = makeAlphaid();
        await failDone(client.nfs.dir.create("app", dir, false), done);
        await failDone(client.dns.registerAndAddService(longName, "www", "app", dir), done);

        const exampleDir: DnsHomeDirectory = await client.dns.getHomeDirectory(longName, "www");

        expect(exampleDir.info.name).toEqual(dir);
        done();
    });

    it("can fetch a file from a service home directory", async (done) => {
        //create a directory, put a file in it,
        //register a long name and service to that directory, get file
        const dir: string = makeAlphaid();
        const filename: string = makeAlphaid() + ".txt";
        const dirFilename: string = `${dir}/${filename}`;

        let testStream: stream.Transform = new stream.PassThrough();
        const one_piece: Buffer = Buffer.from(`There once was a man named Gold Roger.`);
        await new Promise((resolve, reject) => {
            testStream.write(one_piece, (err) => {
                expect(err).toBeUndefined();
                resolve();
            });
        })

        await failDone(client.nfs.dir.create("app", dir, false), done);
        const mkFile: Promise<void> = client.nfs.file.create("app", dirFilename, testStream,
                                                             one_piece.byteLength, "text/plain");
        await mkFile.catch((err) => {
            fail(err);
            done();
        });

        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", dir), done);

        const fileInfo: SafeFile = await client.dns.getFile(longName, "www", filename);
        expect(fileInfo.body).toEqual(one_piece);

        done();
    });

    it("can remove a service from a longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        let services: DnsServiceList = await client.dns.getServices(longName);
        expect(services.length).toEqual(1);

        await failDone(client.dns.removeService(longName, "www"), done);

        services = await client.dns.getServices(longName);
        expect(services.length).toEqual(0);

        done();
    });

    it("can list the longNames registered by the user", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        const longNames: DnsLongNameList = await client.dns.getLongNames();
        expect(longNames.length).not.toBe(null);
        done();
    });
});
