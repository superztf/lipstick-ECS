import { EntityAdmin } from "./EntityAdmin";

export abstract class System {
    protected admin: EntityAdmin;
    protected _priority: number;

    constructor(a: EntityAdmin, p: number) {
        this.admin = a;
        this._priority = p;
    }

    // bigger number means higher priority
    public get priority(): number {
        return this._priority;
    }

    public abstract Update(timeDelta: number): void;
}
