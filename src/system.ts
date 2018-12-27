import { EntityAdmin } from "./EntityAdmin";
import { throwError } from "./_utils";

/**
 * Base class for all Systems to inherit from. And you should implement the abstract method System.Update().
 * Each System do not know what entity is and do not care about entity, they just do something with Component sets.
 *
 * @export
 * @abstract
 * @class System
 */
export abstract class System {

    /**
     * EntityAdmin.UpdateSystems() will call this method in each frame.
     *
     * @param {number} timeDelta the milliseconds costed by last frame.
     * @memberof System
     */
    public static Update(admin: EntityAdmin, timeDelta: number) {
        throwError("System.Update should be implemented");
    }
}
