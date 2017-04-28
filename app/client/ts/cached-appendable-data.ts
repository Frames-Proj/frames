//
// A wrapper around appendable-data which maintains a cache of
// the DataIDHandles that have been appended.
//

import { Drop, AppendableDataHandle, FromDataIDHandleResponse
         , withDropP, withDrop, DataIDHandle, AppedableDataMetadata } from "safe-launcher-client";
import { safeClient as sc } from "./util";

export default class CachedAppendableDataHandle implements Drop {
    private _cache: DataIDHandle[];
    private _handle: AppendableDataHandle;
    public constructor(private _handleInfo: FromDataIDHandleResponse) {
        this._handle = _handleInfo.handleId;
        this._cache = [];
    }

    // basic property accessors
    public get length(): number {
        return this._handleInfo.dataLength + this._cache.length;
    }
    public getMetadata(): Promise<AppedableDataMetadata> { return this._handle.getMetadata(); }
    public save() { return this._handle.save(); }
    public toDataIdHandle() { return this._handle.toDataIdHandle(); }
    public update() { return this._handle.update(); }
    public drop(): Promise<void> {
        for (let i: number = 0; i < this._cache.length; ++i) {
            this._cache[i].drop();
        }
        return this._handle.drop();
    }

    public at(i: number): Promise<DataIDHandle> {
        if (i >= this.length || i < 0)
            throw new Error(`CachedAppendableDataHandle::at(${i}) index not in range!`);

        if (i >= this._handleInfo.dataLength) {
            return Promise.resolve(this._cache[i - this._handleInfo.dataLength]);
        } else {
            return this._handle.at(i);
        }
    }


    // If the DataIDHandle at the given index is cached, `withAt`
    // just applies the given function, but otherwise it also drops
    // the generated DataIDHandle
    //
    // @param i - the index in the CachedAppendableDataHandle to apply `f` to
    // @param f - the function to apply
    // @returns the result of the given function
    public async withAt<T>(i: number, f: (hdl: DataIDHandle) => Promise<T>): Promise<T> {
        if (i >= this.length || i < 0)
            throw new Error(`CachedAppendableDataHandle::withAt(${i}) index not in range!`);

        if (i >= this._handleInfo.dataLength) {
            return f(this._cache[i - this._handleInfo.dataLength]);
        } else {
            const did = await this._handle.at(i);
            return f(did)
                .then(async x => { await did.drop(); return x; })
                .catch(async err => { await did.drop(); throw err; });
        }
    }

    public append(x: DataIDHandle): Promise<void> {
        // only append to the cache when the promise resolves
        return this._handle.append(x)
            .then(_ => { this._cache.push(x); return; });
    }

    public static async new(xorName: DataIDHandle): Promise<CachedAppendableDataHandle> {
        return new CachedAppendableDataHandle(await sc.ad.fromDataIdHandle(xorName));
    }
}


