import { EntityAdmin } from "./EntityAdmin";
import { throwError } from "./_utils";

/**
 * Base class for all Systems to inherit from. And you should implement the static method System.Update().(System will not be instantiated.)
 * Each System do not know what entity is and do not care about entity, they just do something with Component sets.
 *
 * @export
 * @abstract
 * @class System
 */
export class System {

    /**
     * EntityAdmin.UpdateSystems() will call this method in each frame.
     *
     * @static
     * @param {EntityAdmin} admin
     * @param {number} timeDelta
     * @memberof System
     */
    public static Update(admin: EntityAdmin, timeDelta: number) {
        throwError("System.Update should be implemented");
    }
}
