import { Component } from "./component";
import { present, CLASS, IFilter, ComponentType, SystemType } from "./utils";
import { throwError } from "./_utils";
import { FilterComponents, IFilterID, CheckFilter } from "./_filter";

export declare type Entity = number;
export declare type ComponentID = number;
export declare type ComponentBitSet = number;

/**
 * The manager of a World. It cantains systems, entities and the components.
 * Components can be divided into two types: one is assigned to entities to describe the entities's attributes, and the other is common singleton components, which are used to share data between different systems.
 *
 * @export
 * @class EntityAdmin
 */
export class EntityAdmin {
    protected empty_set = new Set();
    protected systems: Array<{ priority: number, system: SystemType }> = [];
    protected deferments: Array<{ func: Function, args: any[] }> = [];
    protected pubcoms: Map<ComponentType, Component> = new Map();
    protected lastupdate: number = 0;
    protected running: boolean = false;

    protected next_entity: Entity = 0;
    protected entities: ComponentBitSet[] = [];
    protected recycle_entity: Entity[] = [];
    protected next_comptid: ComponentID = 0;
    protected components: Component[][] = [];
    // entities 存 mapcid
    // components 按 ent 位置存

    /**
     * The default running state is false. This method set it true. EntityAdmin.UpdateSystems() can work only in running===true state.
     *
     * @param {number} [curtime=present()] A currrent time. If not given curtime, will use present().
     * @memberof EntityAdmin
     */
    public start(curtime: number = present()): void {
        this.lastupdate = curtime;
        this.running = true;
    }

    /**
     * Set running state false. In this state, EntityAdmin.UpdateSystems() do nothing.
     *
     * @memberof EntityAdmin
     */
    public stop(): void {
        this.running = false;
    }

    /**
     * Set a public component.
     * Public component is Singleton pattern. It used for sharing data between Systems, but not for assigning to entity.
     *
     * @param c A Component instance
     */
    public SetPubComponent(c: Component) {
        this.pubcoms.set(c.constructor as ComponentType, c);
    }

    /**
     * Get a public component.
     * See EntityAdmin.SetPubComponent().
     *
     * @template T
     * @param {CLASS<T>} cclass A Component class
     * @returns {(undefined | T)}
     * @memberof EntityAdmin
     */
    public GetPubComponent<T extends Component>(cclass: CLASS<T>): undefined | T {
        return this.pubcoms.get(cclass) as undefined | T;
    }

    /**
     * Actually the same as EntityAdmin.GetPubComponent(), but returns by a type assertion(not union undefined).
     * If you are sure this type of component exist, call this method maybe better than EntityAdmin.GetPubComponent().
     *
     * @template T
     * @param {CLASS<T>} cclass A Component class
     * @returns {T}
     * @memberof EntityAdmin
     */
    public SurePubComponent<T extends Component>(cclass: CLASS<T>): T {
        return this.pubcoms.get(cclass) as T;
    }

    /**
     * Push a deferment item. The deferment items will be processed in queue order at the end of each frame and then be cleared out.
     * One EntityAdmin.UpdateSystems() call is one frame.
     *
     * @param {Function} func your function to deal delayed things
     * @param {...any} args parameter list for your function
     * @memberof EntityAdmin
     */
    public PushDeferment(func: Function, ...args: any) {
        this.deferments.push({ func, args });
    }

    /**
     * Add a System, generally be called before EntityAdmin.start().
     *
     * @param {SystemType} system A system class. This class will not be instantiated, but EntityAdmin will call the system's static method Update().
     * @param {number} [priority=0] Bigger number means higher priority. Priority determines the order of updating systems.
     * @memberof EntityAdmin
     */
    public AddSystem(system: SystemType, priority: number = 0) {
        this.systems.push({ system, priority });
        this.systems.sort((a, b) => {
            return b.priority - a.priority;
        });
    }

    /**
     * Call all systems Update() method in order of their priority, and then deal deferment items you pushed before, at last clear deferment buffer.
     * If the running state is false, it will do nothing.
     *
     * @param {number} [curtime] A currrent time. If not given curtime, will use present().
     * @memberof EntityAdmin
     */
    public UpdateSystems(curtime: number = present()) {
        if (this.running) {
            const delta = curtime - this.lastupdate;
            this.lastupdate = curtime;
            for (const s of this.systems) {
                s.system.Update(this, delta);
            }
            for (const delay of this.deferments) {
                delay.func(...delay.args);
            }
            this.deferments = [];
        }
    }

    /**
     * Create an entity. And optional for assigning a list of components at the same time.
     *
     * @param {...Component[]} args Component object list.
     * @returns {Entity} Entity ID. It's a number actually.
     * @memberof EntityAdmin
     */
    public CreateEntity(...args: Component[]): Entity {
        let new_ent = this.recycle_entity.pop();
        if (!new_ent) {
            new_ent = ++this.next_entity;
        }
        this.entities[new_ent] = 0;
        if (args.length > 0) {
            this.AssignComponents(new_ent, ...args);
        }
        return new_ent;
    }

    /**
     * Delete an entity. And the components the entity owns will be removed at the same time.
     *
     * @param {Entity} e Entity ID.
     * @memberof EntityAdmin
     */
    public DeleteEntity(e: Entity): void {
        this.recycle_entity.push(e);
        for (const list of this.components) {
            if (list[e]) {
                (list[e] as any) = undefined;
            }
        }
    }

    /**
     * Delete all entities.
     *
     * @memberof EntityAdmin
     */
    public ClearAllEntity() {
        this.components = [];
        this.entities = [];
        this.recycle_entity = [];
        this.next_entity = 0;
    }

    /**
     * Get an entity's component object.
     *
     * @template T
     * @param {Entity} Entity Entity ID.
     * @param {CLASS<T>} cclass A component class.
     * @returns {(T | undefined)} The component instance or undefined if the entity doesn't own this type of component.
     * @memberof EntityAdmin
     */
    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const list = this.components[cclass.id];
        if (list) {
            return list[entity] as T;
        }
    }

    /**
     *  Identify an entity exist or not.
     *
     * @param {Entity} e Entity ID.
     * @returns {boolean} Return true means the entity exist.
     * @memberof EntityAdmin
     */
    public ValidEntity(e: Entity): boolean {
        if (this.entities[e] === undefined) {
            return false;
        }
        return true;
    }

    /**
     * Assign component objects to an entity. If you assign the same type component object to an entity, the latter will replace the former.
     *
     * @param {Entity} e Entity ID.
     * @param {...Component[]} cs Component object list.
     * @memberof EntityAdmin
     */
    public AssignComponents(e: Entity, ...cs: Component[]): void {
        if (this.entities[e] !== undefined) {
            for (const c of cs) {
                const cls = c.constructor as CLASS<Component>;
                if (!cls.id) {
                    cls.id = ++this.next_comptid;
                    this.components[cls.id] = [];
                }
                this.entities[e] |= (1 << cls.id);
                this.components[cls.id][e] = c;
            }
        }
    }

    /**
     * Remove component objects from an entity.
     * If the entity or components do not exist, this method just do nothing, won't throw error.
     *
     * @param {Entity} e Entity ID.
     * @param {...ComponentType[]} cclass A list of component class.
     * @memberof EntityAdmin
     */
    public RemoveComponents(e: Entity, ...cclass: ComponentType[]) {
        if (this.entities[e] !== undefined) {
            for (const cls of cclass) {
                const list = this.components[cls.id];
                if (list && list[e]) {
                    this.entities[e] ^= (1 << cls.id);
                    (list[e] as any) = undefined;
                }
            }
        }
    }

    /**
     * Determine whether the entity owns the specified type component or not.
     *
     * @param {Entity} e Entity ID.
     * @param {ComponentType} c Component class.
     * @returns {boolean} True means the type of component exist.
     * @memberof EntityAdmin
     */
    public HasComponent(e: Entity, c: ComponentType): boolean {
        const bitset = this.entities[e];
        if (bitset && (bitset & 1 << c.id)) {
            return true;
        }
        return false;
    }

    /**
     * Returns the number of entities that have the given components.
     * If you want to get the number of entities that match more complex combinations of components, see MatchCountByFilter().
     *
     * @param {ComponentType} cclass Component class.
     * @returns {number}
     * @memberof EntityAdmin
     */
    public GetComponentSize(cclass: ComponentType): number {
        const list = this.components[cclass.id];
        if (list) {
            let cnt = 0;
            for (const compt of list) {
                cnt += 1;
            }
            return cnt;
        }
        return 0;

    }

    /**
     * Returns the iterator of components by your specified class.
     *
     * @template T
     * @param {CLASS<T>} cclass Component class.
     * @returns {IterableIterator<T>} Iterator of component.
     * @memberof EntityAdmin
     */
    public *GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        const list = this.components[cclass.id];
        if (list) {
            for (const compt of list) {
                if (compt) {
                    yield compt as T;
                }
            }
        }
    }

    /**
     * Returns the iterator of components by the first type you give. In this case, you can use EntityAdmin.SureSibling() to get other type components.
     * Example:
     * ```typescript
     * for (const a of admin.GetComponentsByTuple(ComponentA, ComponentB, ComponentC)) {
     *     // In this case, ComponentB and ComponentC must exist in a's owner entity. The a,b,c have the same owner entity.
     *     const b: ComponentB = a.SureSibling(admin, ComponentB);
     *     const c: ComponentC = a.SureSibling(admin, ComponentC);
     *     // Can't confirm whether ComponentD exists.
     *     const d: ComponentD | undefined = a.GetSibling(ComponentD);
     * }
     * ```
     *
     * @template T
     * @param {...[CLASS<T>, ...ComponentType[]]} cclass A list of component class. Require at least two element.
     * @returns {IterableIterator<T>} The iterator of T component instances.
     * @memberof EntityAdmin
     */
    public *GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ComponentType, ...ComponentType[]]): IterableIterator<T> {
        let tuple_bitset = 0;
        const first = cclass[0];
        for (const cls of cclass) {
            tuple_bitset |= (1 << cls.id);
        }
        for (let ent: Entity = 1; ent < this.entities.length; ++ent) {
            const compt_bitset = this.entities[ent];
            if (compt_bitset && (tuple_bitset === (compt_bitset & tuple_bitset))) {
                yield this.components[first.id][ent] as T;
            }
        }
    }

    /**
     * Sometimes it may be necessary to traverse entities with some complex conditions.
     * For example, you might want to traverse entities that have components A, B, C, but no components D, E, and have any one of G, F components.
     * Lipstick-ecs provides the ability to traverse complex component combinations. Before this, should call the method AddWatchings() to specify the component combinations.
     *
     * @param {...[IFilter, ...IFilter[]]} fts List of filters.
     * @memberof EntityAdmin
     */
    public AddWatchings(...fts: [IFilter, ...IFilter[]]) {
    }

    /**
     * Actually the same as EntityAdmin.GetComponentByEntity(), but returns by a type assertion(not union undefined).
     * It is used when you are sure the entity has the component.
     *
     * @template T
     * @param {Entity} entity Entity ID.
     * @param {CLASS<T>} cclass Component class.
     * @returns {T}
     * @memberof EntityAdmin
     */
    public SureComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T {
        return new cclass();
    }

    /**
     * Returns the iterator of entities by your given IFilter.
     *
     * Attention: The filter you given should be specified by EntityAdmin.AddWatchings() before.
     *
     * @param {IFilter} f Component combinations.
     * @returns {IterableIterator<Entity>} Iterator of entities.
     * @memberof EntityAdmin
     */
    public GetEnttsByFilter(f: IFilter): IterableIterator<Entity> {
        return this.empty_set.values();

    }

    /**
     * Returns the number of entities the filter matched.
     *
     * Attention: The filter you given should be specified by EntityAdmin.AddWatchings() before.
     *
     * @param {IFilter} f Component combinations.
     * @returns {number}
     * @memberof EntityAdmin
     */
    public MatchCountByFilter(f: IFilter): number {
        return 0;
    }

    protected matchFilter(e: Entity, fobj: IFilter): boolean {
        return false;
    }
}
