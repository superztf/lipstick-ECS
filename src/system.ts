import { EntityAdmin } from "./EntityAdmin";

/**
 * Base class for all Systems to inherit from. And you should implement the abstract method System.Update().
 * Each System do not know what entity is and do not care about entity, they just do something with Component sets.
 *
 * @export
 * @abstract
 * @class System
 */
export abstract class System {
    protected admin: EntityAdmin;
    protected _priority: number;

    /**
     * It's unnecessary to create an System object directly.
     * EntityAdmin.AddSystem() will create an instance of System.
     *
     * @param {EntityAdmin} a
     * @param {number} p
     * @memberof System
     */
    constructor(a: EntityAdmin, p: number) {
        this.admin = a;
        this._priority = p;
    }

    /**
     * Get the system's priority. Bigger number means higher priority.
     *
     * @readonly
     * @type {number}
     * @memberof System
     */
    public get priority(): number {
        return this._priority;
    }

    /**
     * EntityAdmin.UpdateSystems() will call this method in each frame.
     *
     * @abstract
     * @param {number} timeDelta the milliseconds costed by last frame.
     * @memberof System
     */
    public abstract Update(timeDelta: number): void;
}
