import { Component } from "./component";
import { present, CLASS, IFilter, ComponentType, SystemType } from "./utils";
import { throwError } from "./_utils";
import { Filter, FilterType } from "./filter";

export declare type Entity = number;
export declare type ComponentID = number;
export declare type ComponentBitMap = number;

/**
 * The manager of a World. It cantains systems, entities and the components.
 * Components can be divided into two types: one is assigned to entities to describe the entities's attributes, and the other is common singleton components, which are used to share data between different systems.
 *
 * @export
 * @class EntityAdmin
 */
export class EntityAdmin {
    protected systems: Array<{ priority: number, system: SystemType }> = [];
    protected deferments: Array<{ func: Function, args: any[] }> = [];
    protected pubcoms: Map<ComponentType, Component> = new Map();
    protected lastupdate: number = 0;
    protected running: boolean = false;

    protected next_entity: Entity = 0;
    protected entities: ComponentBitMap[] = [];
    protected compt_index: number[][] = [];
    protected recycle_entity: Entity[] = [];
    protected next_comptid: ComponentID = 0;
    protected components: Component[][] = [];
    protected entset: Set<Entity> = new Set();

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
        this.compt_index[new_ent] = [];
        this.entset.add(new_ent);
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
        if (this.entities[e] === undefined) {
            return;
        }
        (this.entities[e] as any) = undefined;
        this.recycle_entity.push(e);
        this.entset.delete(e);
        const list = this.compt_index[e];
        for (let i = 1; i < list.length; ++i) {// 测试entries和这种方式的迭代效率对比
            const index = list[i];
            if (index) {
                const comobjs = this.components[i];
                comobjs[index] = comobjs[comobjs.length - 1];
                comobjs.pop();
            }
        }
    }

    /**
     * Delete all entities.
     *
     * @memberof EntityAdmin
     */
    public ClearAllEntity() {
        for (const k of this.components.keys()) {
            this.components[k] = [];
        }
        this.entities = [];
        this.recycle_entity = [];
        this.compt_index = [];
        this.next_entity = 0;
        this.entset.clear();
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
     * Get the number of all entities.
     *
     * @readonly
     * @type {number}
     * @memberof EntityAdmin
     */
    public get entitycount(): number {
        return this.entset.size;
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
        if (this.entities[entity] === undefined) {
            return;
        }
        const index = this.compt_index[entity][cclass.id];
        if (index !== undefined) {
            return this.components[cclass.id][index] as T;
        }
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
                if (c.entity) {
                    throwError(`${c.constructor.name} has been assign to ${c.entity}, cannot assign to ${e} repeatedly.`);
                }
                const cls = c.constructor as CLASS<Component>;
                if (!cls.id) {
                    cls.id = ++this.next_comptid;
                    this.components[cls.id] = [];
                }
                const listc = this.components[cls.id];
                (c as any).m_entity = e;
                (c as any).m_admin = this;
                this.entities[e] |= (1 << cls.id);
                this.compt_index[e][cls.id] = listc.length;
                listc.push(c);
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
                const index = this.compt_index[e][cls.id];
                if (index === undefined) {
                    continue;
                }
                const list = this.components[cls.id];
                const lastobj = list[list.length - 1];
                list[index] = lastobj;
                list.pop();
                if (lastobj.entity !== e) {
                    this.compt_index[lastobj.entity][cls.id] = index;
                }
                this.entities[e] ^= (1 << cls.id);
                (this.compt_index[e][cls.id] as any) = undefined;

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
        const bitmap = this.entities[e];
        if (bitmap && (bitmap & 1 << c.id)) {
            return true;
        }
        return false;
    }

    public TransferComponent(from: Entity, to: Entity, cls: ComponentType): boolean {
        if (this.entities[from] === undefined || this.entities[to] === undefined) {
            return false;
        }
        const index = this.compt_index[from][cls.id];
        if (!index) {
            return false;
        }
        (this.compt_index[from][cls.id] as any) = undefined;
        this.entities[from] ^= (1 << cls.id);
        this.compt_index[to][cls.id] = index;
        this.entities[to] |= (1 << cls.id);
        return true;
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
            return list.length;
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
    public GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        const list = this.components[cclass.id];
        if (list) {
            return list.values() as IterableIterator<T>;
        } else {
            return [].values();
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
    public GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ComponentType, ...ComponentType[]]): IterableIterator<T> {
        const first = cclass[0];
        const listfirst = this.components[first.id];
        if (!listfirst) {
            return [].values();
        }
        let tuple_bitmap = 0;
        for (const cls of cclass) {
            tuple_bitmap |= (1 << cls.id);
        }
        const retlist: Component[] = [];
        for (const c of listfirst) {
            const ent = c.entity;
            const compt_bitmap = this.entities[ent];
            if (compt_bitmap && (tuple_bitmap === (compt_bitmap & tuple_bitmap))) {
                retlist.push(this.components[first.id][this.compt_index[ent][first.id]]);
            }
        }
        return retlist.values() as IterableIterator<T>;
    }

    /**
     * Sometimes it may be necessary to traverse entities with some complex conditions.
     * For example, you might want to traverse entities that have components A, B, C, but no components D, E, and have any one of G, F components.
     * Lipstick-ecs provides the ability to traverse complex component combinations. Before this, should call the method AddWatchings() to specify the component combinations.
     *
     * @param {...[IFilter, ...IFilter[]]} fts List of filters.
     * @memberof EntityAdmin
     */
    public AddWatchings(...fts: [FilterType, ...FilterType[]]) {
        const calbit = (listc: ComponentType[]): number => {
            let bits = 0;
            for (const cls of listc) {
                if (!cls.id) {
                    cls.id = ++this.next_comptid;
                    this.components[cls.id] = [];
                }
                bits |= 1 << cls.id;
            }
            return bits;
        };

        for (const f of fts) {
            f.all_bit = calbit(f.all_of);
            f.any_bit = calbit(f.any_of);
            f.none_bit = calbit(f.none_of);
        }
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
        return this.GetComponentByEntity(entity, cclass) as T;
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
    public GetEnttsByFilter(fcls: FilterType): IterableIterator<Entity> {
        const retlist: Entity[] = [];
        for (const ent of this.entset.values()) {
            const entity_cid = this.entities[ent];
            if (fcls.all_bit !== (fcls.all_bit & entity_cid)) {
                continue;
            }
            if (fcls.any_bit) {
                if (!(fcls.any_bit & entity_cid)) {
                    continue;
                }
            }
            if (fcls.none_bit & entity_cid) {
                continue;
            }
            retlist.push(ent);
        }
        return retlist.values();
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
    public MatchCountByFilter(fcls: FilterType): number {
        let cnt = 0;
        for (const ent of this.entset.values()) {
            const entity_cid = this.entities[ent];
            if (fcls.all_bit !== (fcls.all_bit & entity_cid)) {
                continue;
            }
            if (fcls.any_bit) {
                if (!(fcls.any_bit & entity_cid)) {
                    continue;
                }
            }
            if (fcls.none_bit & entity_cid) {
                continue;
            }
            cnt += 1;
        }
        return cnt;
    }

    public MatchFilter(ent: Entity, fcls: FilterType): boolean {
        const entity_cid = this.entities[ent];
        if (entity_cid === undefined) {
            return false;
        }
        if (fcls.all_bit !== (fcls.all_bit & entity_cid)) {
            return false;
        }
        if (fcls.any_bit) {
            if (!(fcls.any_bit & entity_cid)) {
                return false;
            }
        }
        if (fcls.none_bit & entity_cid) {
            return false;
        }
        return true;
    }
}
