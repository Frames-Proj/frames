


export abstract class MaidSafeError {
    constructor() {
    }

    abstract show(): string;
    
    toString(): string {
        return `MaidSafeError::${this.show()}`;
    }
}
export class SAFEAuthError extends MaidSafeError {
    subErr : any;
    constructor(subErr ?: any) {
        super();
        this.subErr = subErr;
    }
    show() {
        return `SAFEAuthError::${this.subErr != undefined ? this.subErr.toString() : ''}`;
    }
}
export class SAFEDirCreationError extends MaidSafeError {
    constructor() { super(); }
    show() {return "SAFEDirCreationError";}
}


//
// Internal Errors
//

export class InstantiationError {
    className: string;
    constructor(className: string) {
        this.className = className;
    }

    toString(): string {
        return `InstantiationError: Use ${this.className}.getInstance() instead of new.`;
    }
}
