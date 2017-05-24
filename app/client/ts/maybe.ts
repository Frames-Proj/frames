export interface MaybePattern<T, K> {
    just: (value: T) => K,
    nothing: () => K
}

export class Maybe<T> {
    private constructor(private _isNothing: boolean, private value?: T) {};

    public static just<T>(value: T): Maybe<T> {
        return new Maybe(false, value);
    }

    public static nothing<T>(): Maybe<T> {
        return new Maybe<T>(true);
    }

    // TODO: I can't get typescript to be happy when I annotate the eq function
    public equals<T>(rhs: Maybe<T>, eq: (lhsInner, rhsInner) => boolean): boolean {
        if (!this._isNothing && !rhs._isNothing) {
            return eq(this.value, rhs.value);
        } else if (this._isNothing && rhs._isNothing) {
            return true;
        } else {
            return false;
        }
    }

    public isNothing(): boolean {return this._isNothing;}
    public isJust(): boolean {return !this._isNothing;}

    public caseOf<K>(c: MaybePattern<T, K>): K {
        if (this._isNothing) {
            return c.nothing();
        }
        return c.just(this.value);
    }

    public bind<K>(f: (value: T) => Maybe<K>): Maybe<K> {
        if (this._isNothing) {
            return Maybe.nothing<K>();
        }
        return f(this.value);
    }

    public valueOr<K>(defaultVal: K): T|K {
        if (this._isNothing) {
            return defaultVal;
        }
        return this.value;
    }

    public onJust(f: (value: T) => any): void {
        if (!this._isNothing) f(this.value);
    }
}
