import { EntityAdmin, Entity } from "./EntityAdmin";
import { CLASS } from "./utils";

/**
 * Base class for all Components to inherit from.
 * Component is a class with data.
 *
 * @export
 * @class Component
 */
export class Component {

    /**
     * Returns owner entity ID by @see m_entity .
     *
     * @readonly
     * @type {Entity}
     * @memberof Component
     */
    public get entity(): Entity {
        return this.m_entity;
    }

    /**
     * Owner entity ID. Before the component instance be assigned to an entity, m_entity is 0. 0 is not a @see ValidEntity forever.
     *
     * @protected
     * @type {Entity}
     * @memberof Component
     */
    protected m_entity: Entity = 0;

    /**
     * Get Sibling component. Sibling components means they have the same entity owner.
     * If the specified type component exist, returns it's instance. If not, returns undefined.
     * This method is the same as admin.@see GetComponentByEntity .
     *
     * @template T
     * @param {EntityAdmin} admin
     * @param {CLASS<T>} cclass The specified component type.
     * @returns {(T | undefined)}
     * @memberof Component
     */
    public GetSibling<T extends Component>(admin: EntityAdmin, cclass: CLASS<T>): T | undefined {
        return admin.GetComponentByEntity(this.m_entity, cclass);
    }

    /**
     * Actually the same as @see GetSibling ,but returns by a type assertion.
     * If you are sure sibling component exist, call this method. The return type does not union undefined.
     *
     * @template T
     * @param {EntityAdmin} admin
     * @param {CLASS<T>} cclass Component type.
     * @returns {T}
     * @memberof Component
     */
    public SureSibling<T extends Component>(admin: EntityAdmin, cclass: CLASS<T>): T {
        return admin.GetComponentByEntity(this.m_entity, cclass) as T;
    }

    /**
     * Add one or more sibing components. The same as admin.@see AssignComponents (entity,...cs)
     *
     * @param {EntityAdmin} admin
     * @param {...Component[]} cs A list of component instances.
     * @memberof Component
     */
    public AddSibling(admin: EntityAdmin, ...cs: Component[]): void {
        admin.AssignComponents(this.m_entity, ...cs);
    }

    /**
     * Remove one or more sibing components. The same as admin.@see RemoveComponents (entity, ...cs)
     *
     * @param {EntityAdmin} admin
     * @param {...Array<CLASS<Component>>} cs A list of component instances.
     * @memberof Component
     */
    public RemoveSibling(admin: EntityAdmin, ...cs: Array<CLASS<Component>>): void {
        admin.RemoveComponents(this.m_entity, ...cs);
    }
}
