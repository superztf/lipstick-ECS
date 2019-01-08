import { Component } from "./component";
import { present, CLASS, IFilter, ComponentType, SystemType } from "./utils";
import { throwError } from "./_utils";
import { FilterComponents, IFilterID, CheckFilter } from "./_filter";

export declare type Entity = number;

/**
 * The manager of a World. It cantains systems, entities and the components.
 * Components can be divided into two types: one is assigned to entities to describe the entities's attributes, and the other is common singleton components, which are used to share data between different systems.
 *
 * @export
 * @class EntityAdmin
 */
export class EntityAdmin {
    protected next_entity: Entity = 0;
    protected entities: Map<Entity, Map<ComponentType, Component>> = new Map();
    protected comptowners: Map<ComponentType, Set<Entity>> = new Map();
    protected comptcontain: Map<ComponentType, Set<Component>> = new Map();
    protected systems: Array<{ priority: number, system: SystemType }> = [];
    protected deferments: Array<{ func: Function, args: any[] }> = [];
    protected pubcoms: Map<ComponentType, Component> = new Map();
    protected lastupdate: number = 0;
    protected running: boolean = false;
    protected watch_open: boolean = false;
    protected watch_compts: Map<ComponentType, Set<IFilter>> = new Map();
    protected watch_ents: Map<IFilter, Set<Entity>> = new Map();
    protected watch_fid: Map<IFilter, IFilterID> = new Map();
    protected next_cid: number = 1;
    protected entity_cidmap: Map<Entity, number> = new Map();
    protected tuple_cache: Map<number, Set<Component>> = new Map();
    protected tuple_dirty: Map<ComponentType, boolean> = new Map();
    protected empty_set: Set<any> = new Set();

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
        const new_ent = ++this.next_entity;
        this.entities.set(new_ent, new Map());
        this.entity_cidmap.set(new_ent, 0);
        if (args.length > 0) {
            this.AssignComponents(new_ent, ...args);
        } else {
            this.afterMultiComptChange(new_ent);
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
        const coms = this.entities.get(e);
        if (coms) {
            for (const cobj of coms.values()) {
                const ents = this.comptowners.get(cobj.constructor as ComponentType) as Set<number>;
                ents.delete(e);
                const compts = this.comptcontain.get(cobj.constructor as ComponentType) as Set<Component>;
                compts.delete(cobj);

            }
            this.entities.delete(e);
        }
        this.entity_cidmap.delete(e);
        for (const entset of this.watch_ents.values()) {
            entset.delete(e);
        }
    }

    /**
     * Delete all entities.
     *
     * @memberof EntityAdmin
     */
    public ClearAllEntity() {
        for (const e of this.entities.keys()) {
            this.DeleteEntity(e);
        }
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
        const coms = this.entities.get(entity);
        if (coms) {
            return coms.get(cclass) as T;
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
        return this.entities.has(e);
    }

    /**
     * Assign component objects to an entity. If you assign the same type component object to an entity, the latter will replace the former.
     *
     * @param {Entity} e Entity ID.
     * @param {...Component[]} cs Component object list.
     * @memberof EntityAdmin
     */
    public AssignComponents(e: Entity, ...cs: Component[]): void {
        const coms = this.entities.get(e);
        let effect_cnt = 0;
        let effect_cls: ComponentType | undefined;
        if (coms) {
            for (const c of cs) {
                if (c.entity) {
                    throwError(`${c.constructor.name} has been assign to ${c.entity}, cannot assign to ${e} repeatedly.`);
                }
                (c as any).m_entity = e;
                (c as any).m_admin = this;
                const cls = c.constructor as ComponentType;
                let ents = this.comptowners.get(cls);
                if (!ents) {
                    ents = new Set();
                    this.comptowners.set(cls, ents);
                }
                let cobjs = this.comptcontain.get(cls);
                if (!cobjs) {
                    cobjs = new Set();
                    this.comptcontain.set(cls, cobjs);
                }
                ents.add(e);
                cobjs.add(c);
                if (!coms.has(cls)) {
                    if (this.tuple_dirty.has(cls)) {
                        this.tuple_dirty.set(cls, true);
                    }
                    if (this.watch_open && this.watch_compts.has(cls)) {
                        if (!effect_cnt) {
                            effect_cls = c.constructor as ComponentType;
                        }
                        ++effect_cnt;
                        let cidmap = this.entity_cidmap.get(e) as number;
                        cidmap |= 1 << cls.id;
                        this.entity_cidmap.set(e, cidmap);
                    }
                }
                coms.set(cls, c);
            }
        }
        if (effect_cnt === 1) {
            this.afterSingleComptChange(e, effect_cls as ComponentType);
        } else if (effect_cnt > 1) {
            this.afterMultiComptChange(e);
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
        const coms = this.entities.get(e);
        if (coms) {
            for (const c of cclass) {
                const cobj = coms.get(c);
                if (cobj) {
                    coms.delete(c);
                    const compts = this.comptcontain.get(c) as Set<Component>;
                    compts.delete(cobj);
                }
            }
        }

        let effect_cnt = 0;
        let effect_cls: ComponentType | undefined;
        for (const cls of cclass) {
            const ents = this.comptowners.get(cls);
            if (ents) {
                const ret = ents.delete(e);
                if (ret) {
                    if (this.tuple_dirty.has(cls)) {
                        this.tuple_dirty.set(cls, true);
                    }
                    if (this.watch_open && this.watch_compts.has(cls)) {
                        if (!effect_cnt) {
                            effect_cls = cls;
                        }
                        ++effect_cnt;
                        let cidmap = this.entity_cidmap.get(e) as number;
                        const pos = cls.id;
                        if (cidmap & (1 << pos)) {
                            cidmap ^= 1 << pos;
                            this.entity_cidmap.set(e, cidmap);
                        }
                    }
                }

            }
        }
        if (effect_cnt === 1) {
            this.afterSingleComptChange(e, effect_cls as ComponentType);
        } else if (effect_cnt > 1) {
            this.afterMultiComptChange(e);
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
        const coms = this.entities.get(e);
        if (coms && coms.has(c)) {
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
        const compts = this.comptcontain.get(cclass);
        if (compts) {
            return compts.size;
        } else {
            return 0;
        }
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
        const compts = this.comptcontain.get(cclass);
        if (compts) {
            return compts.values() as IterableIterator<T>;
        } else {
            return this.empty_set.values();
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
     * @param {...[CLASS<T>, ...ComponentType[]]} cclass A list of component class.
     * @returns {IterableIterator<T>} The iterator of T component instances.
     * @memberof EntityAdmin
     */
    public GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ...ComponentType[]]): IterableIterator<T> {
        if (cclass.length <= 1) {
            return this.GetComponents(cclass[0]);
        }
        const cache = this.tryGetTupleCache(cclass);
        if (cache) {
            return cache.values() as IterableIterator<T>;
        }
        interface ICInfo { type: CLASS<Component>; len: number; }
        const top = cclass[0];
        const length_info: ICInfo[] = [];
        for (const c of cclass) {
            const set = this.comptowners.get(c);
            if (!set) {
                return this.empty_set.values();
            }
            length_info.push({ type: c, len: set.size });
        }
        length_info.sort((a, b) => {
            return a.len - b.len;
        });

        const list = new Set();
        for (const c1 of this.GetComponents(top)) {
            let pass = true;
            for (const info of length_info) {
                if (!this.GetComponentByEntity(c1.entity, info.type)) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                list.add(c1);
            }
        }
        this.updateTupleCache(cclass, list);
        return list.values();
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
        if (this.entities.size > 0) {
            throwError("AddWatching should be used before CreateEntity");
        }
        if (!this.watch_open) { this.watch_open = true; }
        for (const f of fts) {
            CheckFilter(f);
            for (const c of FilterComponents(f)) {
                let set = this.watch_compts.get(c);
                if (!set) {
                    set = new Set();
                    this.watch_compts.set(c, set);
                }
                set.add(f);
                if (!c.id) {
                    c.id = this.next_cid++;
                }
            }
            if (!this.watch_fid.has(f)) {
                let all_id = 0;
                let none_id = 0;
                let any_id = 0;
                if (f.all_of) {
                    for (const c of f.all_of) {
                        all_id |= 1 << c.id;
                    }
                }
                if (f.any_of) {
                    for (const c of f.any_of) {
                        any_id |= 1 << c.id;
                    }
                }
                if (f.none_of) {
                    for (const c of f.none_of) {
                        none_id |= 1 << c.id;
                    }
                }
                this.watch_fid.set(f, { all_id, none_id, any_id });
            }
            if (!this.watch_ents.has(f)) {
                this.watch_ents.set(f, new Set());
            }
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
        const coms = this.entities.get(entity);
        return (coms as Map<ComponentType, Component>).get(cclass) as T;
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
        const set = this.watch_ents.get(f);
        if (set) {
            return set.values();
        } else {
            return this.empty_set.values();
        }
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
        const set = this.watch_ents.get(f);
        if (set) {
            return set.size;
        }
        return 0;
    }

    protected matchFilter(e: Entity, fobj: IFilter): boolean {
        const entity_cid = this.entity_cidmap.get(e) as number;
        const fid = this.watch_fid.get(fobj) as IFilterID;

        if (fid.all_id !== (fid.all_id & entity_cid)) {
            return false;
        }
        if (fid.any_id) {
            if (!(fid.any_id & entity_cid)) {
                return false;
            }
        }
        if (fid.none_id & entity_cid) {
            return false;
        }
        return true;
    }

    protected afterMultiComptChange(e: Entity) {
        for (const [fobj, set] of this.watch_ents.entries()) {
            if (this.matchFilter(e, fobj)) {
                set.add(e);
            } else {
                set.delete(e);
            }
        }
    }

    protected afterSingleComptChange(e: Entity, cclass: ComponentType) {
        const fobjset = this.watch_compts.get(cclass) as Set<IFilter>;
        for (const fobj of fobjset.values()) {
            const set = this.watch_ents.get(fobj) as Set<number>;
            if (this.matchFilter(e, fobj)) {
                set.add(e);
            } else {
                set.delete(e);
            }
        }
    }

    protected tryGetTupleCache(listc: ComponentType[]): void | Set<Component> {
        let tupleid = 0;
        for (const c of listc) {
            if (!this.tuple_dirty.has(c)) {
                this.tuple_dirty.set(c, true);
            }
            if (!c.id) {
                c.id = this.next_cid++;
            }
        }
        for (const c of listc) {
            if (this.tuple_dirty.get(c)) {
                return;
            }
            tupleid |= 1 << c.id;
        }
        return this.tuple_cache.get(tupleid);
    }

    protected updateTupleCache(listc: ComponentType[], set: Set<Component>) {
        let tupleid = 0;
        for (const c of listc) {
            tupleid |= 1 << c.id;
            this.tuple_dirty.set(c, false);
        }
        this.tuple_cache.set(tupleid, set);
    }
}
