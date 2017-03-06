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

let leakStats: Map<Handle, { finished: boolean,
                             className: string,
                             leakBlock: string
                           }> = new Map();
let collectLeakStatistics: boolean = false;
let currentLeakStatBlock: string = "default";
export function setCollectLeakStats(): void {
    collectLeakStatistics = true;
}
export function setCollectLeakStatsBlock(block: string) {
    currentLeakStatBlock = block;
}
export type LeakResults = Map<string, Map<string, {
        handlesCreated: number,
        handlesDropped: number,
        handlesLeaked: number
    }>>;
export function getLeakStatistics(): LeakResults {
    let summaries: LeakResults = new Map();

    for (let [_, status] of leakStats) {
        let blkSum = summaries[status.leakBlock];
        if (blkSum === undefined) {
            blkSum = new Map();
            summaries.set(status.leakBlock, blkSum);
        }

        let s = blkSum[status.className];
        if (s === undefined) {
            s = {
                handlesCreated: 0,
                handlesDropped: 0,
                handlesLeaked: 0
            };
        }
        s.handlesCreated += 1;
        s.handlesLeaked += 1;
        if (status.finished) {
            s.handlesDropped += 1;
            s.handlesLeaked -= 1;
        }

        blkSum.set(status.className, s);
        summaries.set(status.leakBlock, blkSum);
    }

    return summaries;
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
        if (collectLeakStatistics) {
            leakStats.set(this, {
                finished: false,
                className: this.constructor.name,
                leakBlock: currentLeakStatBlock
            });
        }
    }

    public drop(): Promise<void> {
        const p = this.dropImpl();
        this.valid = false;
        if (collectLeakStatistics) {
            let s = leakStats.get(this);
            s.finished = true;
            leakStats.set(this, s);
        }
        return p;
    }
    protected abstract dropImpl(): Promise<void>;
}
