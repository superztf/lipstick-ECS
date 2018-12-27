import { EntityAdmin, Entity } from "./EntityAdmin";
import { CLASS } from "./utils";

/**
 * class for all Components to inherit from.
 * Component is a class with data.
 *
 * @export
 * @class Component
 */
export class Component {

    /**
     * Returns owner entity ID. Before the component instance be assigned to an entity, it returns 0.
     *
     * @readonly
     * @type {Entity}
     * @memberof Component
     */
    public get entity(): Entity {
        return this.m_entity;
    }

    protected get admin(): EntityAdmin {
        return this.m_admin as EntityAdmin;
    }

    /**
     * Owner entity ID. Before the component instance be assigned to an entity, m_entity is 0. 0 is not a valid entity forever.
     *
     * @protected
     * @type {Entity}
     * @memberof Component
     */
    protected m_entity: Entity = 0;
    protected m_admin: EntityAdmin | undefined;

    /**
     * Get Sibling component. Sibling components means they have the same entity owner.
     * If the specified type component exist, returns it's instance. If not, returns undefined.
     *
     * @template T
     * @param {EntityAdmin} admin
     * @param {CLASS<T>} cclass The specified component type.
     * @returns {(T | undefined)}
     * @memberof Component
     */
    public GetSibling<T extends Component>(cclass: CLASS<T>): T | undefined {
        return this.admin.GetComponentByEntity(this.m_entity, cclass);
    }

    /**
     * Actually the same as GetSibling, but returns by a type assertion.
     * If you are sure sibling component exist, call this method. The return type does not union undefined.
     *
     * @template T
     * @param {EntityAdmin} admin
     * @param {CLASS<T>} cclass Component type.
     * @returns {T}
     * @memberof Component
     */
    public SureSibling<T extends Component>(cclass: CLASS<T>): T {
        return this.admin.GetComponentByEntity(this.m_entity, cclass) as T;
    }

    /**
     * Add one or more sibing components. If the owner entity has owned the component type you give, the new component instance will replace the old.
     *
     * @param {EntityAdmin} admin
     * @param {...Component[]} cs A list of component instances.
     * @memberof Component
     */
    public AddSibling(...cs: Component[]): void {
        this.admin.AssignComponents(this.m_entity, ...cs);
    }

    /**
     * Remove one or more sibing components.
     * Remove a component type that the owner entity doesn't own is allowed. So it's not necessary to determine whether the component type is owned before removing it.
     *
     * @param {EntityAdmin} admin
     * @param {...Array<CLASS<Component>>} cs A list of component instances.
     * @memberof Component
     */
    public RemoveSibling(...cs: Array<CLASS<Component>>): void {
        this.admin.RemoveComponents(this.m_entity, ...cs);
    }
}
