
// File: util.ts
//
// Some utility functions
//

import { Response } from "web-request";

export function assert(test: boolean, message: string) {
    if (!test) {
        console.error("Assert failed: " + message);
        process.exit(1);
    }
}

export class SafeError extends Error {
    public message: string;
    public res: Response<any>;
    constructor(message: string, res: Response<any>) {
        super(message + " " + JSON.stringify(res));
        this.res = res;
    }
}

export class NotFoundError extends SafeError {
    constructor(res: Response<any>) {
        super("", res);
    }
}

export class UnexpectedResponseContent extends SafeError {
    constructor(res: Response<any>) {
        super("Unexpected response content", res);
    }
}

export class InvalidHandleError extends Error {
    constructor(handle: number, method: string) {
        super(`Handle=${handle} is invalid. called from ${method}`);
    }
}

// for use in a promise context
export async function saneResponse<T>(response: Promise<Response<T>>): Promise<Response<T>> {
    return response.then( (res) => {

        if (res.statusCode === 401) { // 401 means that we were denied by the user
            throw new SafeError("Auth denied by safe launcher.", res );
        } else if (res.statusCode === 404) {
            throw new NotFoundError(res);

        // we should at least be in the 200 status code range
        } else if (Math.floor(res.statusCode / 100) !== 2) {
            throw new SafeError(`statusCode=${res.statusCode}`, res);
        } else {
            return res;
        }
    });
}
