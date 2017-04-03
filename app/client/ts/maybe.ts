export interface MaybePattern<T, K> {
    just: (value: T) => K,
    nothing: () => K
}

export class Maybe<T> {
    private constructor(private isNothing: boolean, private value?: T) {};

    public static just<T>(value: T): Maybe<T> {
        return new Maybe(false, value);
    }

    public static nothing<T>(): Maybe<T> {
        return new Maybe<T>(true);
    }

    public caseOf<K>(c: MaybePattern<T, K>): K {
        if (this.isNothing) {
            return c.nothing();
        }
        return c.just(this.value);
    }

    public bind<K>(f: (value: T) => Maybe<K>): Maybe<K> {
        if (this.isNothing) {
            return Maybe.nothing<K>();
        }
        return f(this.value);
    }

    public valueOr<K>(defaultVal: K): T|K {
        if (this.isNothing) {
            return defaultVal;
        }
        return this.value;
    }
}
