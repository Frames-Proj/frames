//
// File: src/ts/raii.ts
//
// Try to hack some RAII principles into typescript to deal
// with actually dropping the handles
//

import { ApiClient } from "./client";

export interface Drop {
    drop(): Promise<void>;
}

export async function withDrop<A extends Drop, B>(p: A, f: (x: A) => B): Promise<B> {
    const ret: B = f(p);
    await p.drop();
    return ret;
}

export async function withDropP<A extends Drop, B>(p: A, f: (x: A) => Promise<B>): Promise<B> {
    const ret: B = await f(p);
    await p.drop();
    return ret;
}

export abstract class Handle implements Drop {
    // Provides some way to get access to the auth token.
    // It is better to just store a reference in the handles
    // because copying might get expensive, and the API
    // client is supposed to live for the lifetime of the application.
    readonly client: ApiClient;
    readonly handle: number;

    // A flag to make sure that no methods are called after drop
    valid: boolean;

    constructor(c: ApiClient, handle: number) {
        this.client = c;
        this.handle = handle;
        this.valid = true;
    }

    public drop(): Promise<void> {
        const p = this.dropImpl();
        this.valid = false;
        return p;
    }
    protected abstract dropImpl(): Promise<void>;
}
