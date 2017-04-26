
import { UnexpectedResponseContent, SafeError } from "./util";
import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse, InvalidHandleError } from "./util";
import { DataIDHandle } from "./data-id";
import * as WebRequest from "web-request";
import { Handle } from "./raii";

import * as crypto from "crypto";


export type FilterType = "BlackList" | "WhiteList";

export interface AppendableDataMetadataBase {
    isOwner: boolean;
    version: number;
    filterType: FilterType;
    dataLength: number;
    deletedDataLength: number;
}
function isAppendableDataMetadataBase(x: any): x is AppendableDataMetadataBase {
    return (  typeof x.isOwner === "boolean"
           && typeof x.version === "number"
           && (typeof x.filterType === "string"
                  && (x.filterType === "BlackList" || x.filterType === "WhiteList"))
           && typeof x.dataLength === "number"
           && typeof x.deletedDataLength === "number");
}

interface FromDataIDHandleResponseImpl extends AppendableDataMetadataBase {
    handleId: number;
}
function isFromDataIDHandleResponseImpl(x: any): x is FromDataIDHandleResponseImpl {
    return (typeof x.handleId === "number") &&
            isAppendableDataMetadataBase(x);
}


export interface FromDataIDHandleResponse extends AppendableDataMetadataBase {
    handleId: AppendableDataHandle;
}
function isFromDataIDHandleResponse(x: any): x is FromDataIDHandleResponse {
    return (typeof x.handleId !== "undefined"
            && x.handleId instanceof AppendableDataHandle)
        && isAppendableDataMetadataBase(x);
}


export interface AppedableDataMetadata extends AppendableDataMetadataBase {
    filterLength: number;
}
function isAppendableDataMetadata(x: any): x is AppedableDataMetadata {
    return (typeof x.filterLength !== "undefined") &&
            isAppendableDataMetadataBase(x);
}


export class AppendableDataClient extends ApiClient {

    readonly adEndpoint: string;

    constructor(conf: ApiClientConfig) {
        super(conf);

        this.adEndpoint = this.endpoint + "/appendable-data";
    }


    /**
     *
     * @param name - a 32-byte identifier encoded as a base64 string
     * @param isPrivate - defaults to false
     * @param filterType
     * @param filterKeys - list of signing key handles
     * @returns the appendable data handle
     */
    public async create(name: string,
                        isPrivate: boolean = false,
                        filterType = "BlackList",
                        filterKeys = []): Promise<AppendableDataHandle> {
        if (typeof name === "string") {
            name = crypto.createHash("sha256").update(name).digest("base64");
        }
        const recBody = {
            name: name,
            isPrivate: isPrivate,
            filterType: filterType,
            filterKeys: filterKeys
        };
        const result = await saneResponse(WebRequest.create<any>(
            this.adEndpoint, {
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

        return new AppendableDataHandle(this, result.content.handleId);
    };

    /**
     *
     * @param id - the data id handle to be converted
     * @returns an appendable data id
     */
    public async fromDataIdHandle(id: DataIDHandle): Promise<FromDataIDHandleResponse> {

        const result = await saneResponse(WebRequest.create<any>(
            `${this.adEndpoint}/handle/${id.handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (isFromDataIDHandleResponseImpl(result.content)) {
            const res: FromDataIDHandleResponse = {
                isOwner: result.content.isOwner,
                version: result.content.version,
                filterType: result.content.filterType,
                dataLength: result.content.dataLength,
                deletedDataLength: result.content.deletedDataLength,
                handleId: new AppendableDataHandle(this, result.content.handleId)
            };
            return res;
        } else {
            throw new UnexpectedResponseContent(result);
        }
    }

}


export class AppendableDataHandle extends Handle {

    readonly client: AppendableDataClient;

    constructor(c: AppendableDataClient, handle: number) {
        super(c, handle);
    }


    /**
     *
     * @returns a data id referring to the appendable data
     */
    public async toDataIdHandle(): Promise<DataIDHandle> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:toDataIdHandle");

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/data-id/${this.handle}`, {
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
     * @param httpMethod
     */
    private async saveImpl(httpMethod: "PUT" | "POST"): Promise<void> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:saveImpl");

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/${this.handle}`, {
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
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:save");

        return this.saveImpl("PUT");
    }

    /**
     * Update an existing appendable data
     *
     */
    public async update(): Promise<void> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:update");

        return this.saveImpl("POST");
    }

    /**
     * Append the data pointed to by the given dataId to the appendable
     * data. Note that the change will automatically be reflected on the
     * SAFEnet, but the appendable data handle used as input to this function
     * will not be able to see the change. To see the change you must drop the
     * appendable data handle (after first making a dataID for it), then get
     * a new appendable data handle with `AppendableDataClient::fromDataIdHandle`.
     * The change will be reflected in the result.
     *
     * @param dataId - the data id handle to be appended
     */
    public async append(dataId: DataIDHandle): Promise<void> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:append");

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/${this.handle}/${dataId.handle}`, {
                method: "PUT",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);

        if (result.statusCode !== 200) {
            throw new SafeError(
                `Failed to append data-id=${dataId} to appendable-data-handle=${this.handle}.`
                                , result);
        }
    }

    /**
     *
     * @param index - the index to get the data id from
     * @returns the `DataIDHandle` at the index
     */
    public async at(index: number): Promise<DataIDHandle> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:at");

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/${this.handle}/${index}`, {
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
    public async getMetadata(): Promise<AppedableDataMetadata> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "AppendableDataHandle:getMetadata");

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/metadata/${this.handle}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);
        if (isAppendableDataMetadata(result.content)) {
            return result.content;
        } else {
            throw new UnexpectedResponseContent(result);
        }

    }

    /**
     *
     */
    protected async dropImpl(): Promise<void> {
        if (!this.valid) return; // we want drop to be idempotent. It lets us be imprecise about ownership

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.adEndpoint}/handle/${this.handle}`, {
                method: "DELETE",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);

        if (result.statusCode !== 200) {
            throw new SafeError(
                `Failed to drop appendable-data-handle=${this.handle}.`, result);
        }
    }

}

