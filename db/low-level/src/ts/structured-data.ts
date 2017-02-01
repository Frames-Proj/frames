
import { UnexpectedResponseContent, SafeError } from "./util";
import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse } from "./util";
import { DataIDHandle } from "./data-id";
import { CipherOptsHandle } from "./cipher-opts";
import * as WebRequest from "web-request";
import { Response } from "web-request";

import * as crypto from "crypto";

export type TypeTag = number;
function isValidTypeTag(tt: TypeTag): boolean {
    return (tt == 500 || tt == 501 || tt > 15000);
}
export const TYPE_TAG_UNVERSIONED: number = 500;
export const TYPE_TAG_VERSIONED: number = 501;

export type StructuredDataHandle = number;

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
export interface FromDataIDHandleReponse extends StructuredDataMetadata {
    handleId: StructuredDataHandle;
};
function isFromDataIDHandleResponse(x: any): x is FromDataIDHandleReponse {
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
                        version: number = 0): Promise<StructuredDataHandle>
    {
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
        return result.content.handleId;
    }

    /**
     *
     * @param handle - the appendable data handle
     * @param httpMethod
     */
    private async saveImpl(handle: StructuredDataHandle, httpMethod: "PUT" | "POST"): Promise<void> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/${handle}`, {
                method: httpMethod,
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (result.statusCode !== 200) {
            throw new SafeError("Save failed.", result);
        }
    }

    /**
     * Save a new appendable data
     *
     * @param handle - the appendable data handle
     */
    public async save(handle: StructuredDataHandle): Promise<void> {
        return this.saveImpl(handle, "PUT");
    }

    /**
     * Update an existing appendable data
     *
     * @param handle - the appendable data handle
     */
    public async update(handle: StructuredDataHandle): Promise<void> {
        return this.saveImpl(handle, "POST");
    }

    /**
     *
     * @param id - the structured data id to be converted
     * @returns a data id referring to the appendable data
     */
    public async toDataIdHandle(id: StructuredDataHandle): Promise<DataIDHandle> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/data-id/${id}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (typeof result.content.handleId === "undefined") {
            throw new UnexpectedResponseContent(result);
        }
        return result.content.handleId;
    }
    /**
     *
     * @param id - the data id handle to be converted
     * @returns an appendable data id
     */
    public async fromDataIdHandle(id: DataIDHandle): Promise<FromDataIDHandleReponse> {

        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/handle/${id}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (isFromDataIDHandleResponse(result.content)) {
            return result.content;
        } else {
            throw new UnexpectedResponseContent(result);
        }
    }

    /**
     *
     * @param handle - the structured data handle
     * @returns the metadata associated with the appendable data
     */
    public async getMetadata(handle: StructuredDataHandle): Promise<StructuredDataMetadata> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/metadata/${handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
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
    public async drop(handle: StructuredDataHandle): Promise<void> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.sdEndpoint}/handle/${handle}`, {
                method: "DELETE",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }
    }

    /**
     *
     * @param handle - the structured data handle
     * @param version - optional version number if the typeTag for this
     *                  appendable data is `TYPE_TAG_VERSIONED`
     */
    public async read(handle: StructuredDataHandle, version ?: number): Promise<string> {
        const endpoint = `${this.sdEndpoint}/${handle}`
            + (typeof version === "undefined" ? "" : `/${version}`);
        const result: Response<any> = await saneResponse(WebRequest.create<any>(
            endpoint, {
                method: "GET",
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }

        return result.content;
    }

    /**
     *
     * @param handle - the structured data handle
     * @param version - optional version number if the typeTag for this
     *                  appendable data is `TYPE_TAG_VERSIONED`
     */
    public async readAsObject(handle: StructuredDataHandle, version ?: number): Promise<any> {
        const res: string = await this.read(handle, version);

        // the error condition is handled smoothly by the promise
        return JSON.parse(res);
    }

};
