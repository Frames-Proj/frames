
import { UnexpectedResponseContent, SafeError } from "./util";
import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse } from "./util";
import { DataIDHandle } from "./data-id";
import { CipherOptsHandle } from "./cipher-opts";
import * as WebRequest from "web-request";
import { Response, Request } from "web-request";
import { Handle } from "./raii";

import * as crypto from "crypto";

export type SerializedStructuredData = Buffer;
export type TypeTag = number;
function isValidTypeTag(tt: TypeTag): boolean {
    return (tt === 500 || tt === 501 || tt > 15000);
}
export const TYPE_TAG_UNVERSIONED: number = 500;
export const TYPE_TAG_VERSIONED: number = 501;

export interface StructuredDataMetadata {
    isOwner: boolean;
    version: number;
    dataVersionLength: number;
};
function isStructuredDataMetadata(x: any): x is StructuredDataMetadata {
    return !(typeof x.isOwner === "undefined"
            || typeof x.version === "undefined"
            || typeof x.dataVersionLength === "undefined");
}
export interface DeserializeReponse extends StructuredDataMetadata {
    handleId: StructuredDataHandle;
};
function isDeserializeResponse(x: any): x is DeserializeReponse {
    return typeof x.handleId !== "undefined" && isStructuredDataMetadata(x);
}

interface DeserializeReponseImpl extends StructuredDataMetadata {
    handleId: number;
};
function isDeserializeResponseImpl(x: any): x is DeserializeReponseImpl {
    return typeof x.handleId !== "undefined" && isStructuredDataMetadata(x);
}

export class StructuredDataClient extends ApiClient {

    readonly sdEndpoint: string;

    constructor(conf: ApiClientConfig){
        super(conf);

        this.sdEndpoint = this.endpoint + "/structured-data";
    }

    /**
     *
     * @param name - the name of structured data
     * @param typeTag - Versioned (500) | Unversioned (501) | Custom (15000+)
     * @param cypherOpts
     * @param data - the data to be stored
     * @param version - Only needs to be non-zero when
     * @returns the appendable data handle
     */
    public async create(name: string,
                        typeTag: TypeTag,
                        data: string | Buffer | Object,
                        cipherOpts: CipherOptsHandle = -1,
                        version: number = 0): Promise<StructuredDataHandle> {
        if (typeof name === "string") {
            name = crypto.createHash("sha256").update(name).digest("base64");
        }

        if (typeof data === "string") {
            data = Buffer.from(data).toString("base64");
        } else if (data instanceof Buffer) {
            data = data.toString("base64");
        } else if (data instanceof Object) {
            data = Buffer.from(JSON.stringify(data)).toString("base64");
        }

        if (!isValidTypeTag(typeTag)) {
            throw new Error(`Invalid TypeTag=${typeTag}`);
        }

        const recBody = {
            name: name,
            typeTag: typeTag,
            data: data,
        };
        if (cipherOpts >= 0) {
            recBody["cipherOpts"] = cipherOpts;
        }

        const result = await saneResponse(WebRequest.create<any>(
            this.sdEndpoint, {
                method: "POST",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }).response);

        if (typeof result.content.handleId === "undefined") {
            throw new UnexpectedResponseContent(result);
        }

        return new StructuredDataHandle(this, result.content.handleId);
    }

    /**
     *
     * @param id - the data id handle to be converted
     * @returns an appendable data id
     */
    public async fromDataIdHandle(id: DataIDHandle): Promise<DeserializeReponse> {

        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/handle/${id.handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (isDeserializeResponseImpl(result.content)) {
            const res: DeserializeReponse = {
                isOwner: result.content.isOwner,
                version: result.content.version,
                dataVersionLength: result.content.dataVersionLength,
                handleId: new StructuredDataHandle(this, result.content.handleId)
            };
            return res;
        } else {
            throw new UnexpectedResponseContent(result);
        }
    }

    public async deserialise(s: SerializedStructuredData | NodeJS.ReadableStream): Promise<DeserializeReponse> {

        const payload = {
            method: "POST",
            auth: {
                bearer: (await this.authRes).token
            }
        };
        let req: Request<any>;
        if (s instanceof Buffer) {
            payload["body"] = s;
            req = WebRequest.create<any>(`${this.sdEndpoint}/deserialise`, payload);
        } else {
            req = s.pipe(WebRequest.create<any>(`${this.sdEndpoint}/deserialise`, payload));
        }
        const response: Response<any> = await saneResponse(req.response);

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }

        const resObj = JSON.parse(response.content);
        if (isDeserializeResponseImpl(resObj)) {
            const res: DeserializeReponse = {
                isOwner: resObj.isOwner,
                version: resObj.version,
                dataVersionLength: resObj.dataVersionLength,
                handleId: new StructuredDataHandle(this, resObj.handleId)
            };
            return res;
        } else {
            throw new UnexpectedResponseContent(resObj);
        }
    }

};


export class StructuredDataHandle extends Handle {
    readonly client: StructuredDataClient;
    constructor(c: StructuredDataClient, handle: number) {
        super(c, handle);
    }

    /**
     *
     * @param httpMethod
     */
    private async saveImpl(httpMethod: "PUT" | "POST"): Promise<void> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.sdEndpoint}/${this.handle}`, {
                method: httpMethod,
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);

        if (result.statusCode !== 200) {
            throw new SafeError("Save failed.", result);
        }
    }

    /**
     * Save a new appendable data
     *
     */
    public async save(): Promise<void> {
        return this.saveImpl("PUT");
    }

    /**
     * Update an existing appendable data
     *
     */
    public async update(): Promise<void> {
        return this.saveImpl("POST");
    }

    /**
     *
     * @param id - the structured data id to be converted
     * @returns a data id referring to the appendable data
     */
    public async toDataIdHandle(): Promise<DataIDHandle> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.sdEndpoint}/data-id/${this.handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);

        if (typeof result.content.handleId === "undefined") {
            throw new UnexpectedResponseContent(result);
        }
        return new DataIDHandle(this.client, result.content.handleId);
    }

    /**
     *
     * @returns the metadata associated with the appendable data
     */
    public async getMetadata(): Promise<StructuredDataMetadata> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.sdEndpoint}/metadata/${this.handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);
        if (isStructuredDataMetadata(result.content)) {
            return result.content;
        } else {
            throw new UnexpectedResponseContent(result);
        }
    }

    /**
     *
     * @param handle - the structured data handle
     */
    protected async dropImpl(): Promise<void> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.sdEndpoint}/handle/${this.handle}`, {
                method: "DELETE",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }
    }

    /**
     *
     * @param version - optional version number if the typeTag for this
     *                  appendable data is `TYPE_TAG_VERSIONED`
     */
    public async read(version ?: number): Promise<string> {
        const endpoint = `${this.client.sdEndpoint}/${this.handle}`
            + (typeof version === "undefined" ? "" : `/${version}`);
        const result: Response<any> = await saneResponse(WebRequest.create<any>(
            endpoint, {
                method: "GET",
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }

        return result.content;
    }

    /**
     *
     * @param version - optional version number if the typeTag for this
     *                  appendable data is `TYPE_TAG_VERSIONED`
     */
    public async readAsObject(version ?: number): Promise<any> {
        const res: string = await this.read(version);

        // the error condition is handled smoothly by the promise
        return JSON.parse(res);
    }

    /**
     *
     * @returns the serialized structured data
     */
    public async serialise(): Promise<SerializedStructuredData> {
        const endpoint = `${this.client.sdEndpoint}/serialise/${this.handle}`;
        const res: Response<string> =
            await saneResponse(WebRequest.create<string>(endpoint, {
                method: "GET",
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);

        if (res.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${res.statusCode}`, res);
        }

        return Buffer.from(res.content);
    }

};

