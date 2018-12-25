import { Component } from "./component";
import { System } from "./system";
import { present, CLASS, IFilter } from "./utils";
import { throwError } from "./_utils";
import { FilterComponents, FilterMatch, IFilterID } from "./_filter";

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
    protected entities: Map<Entity, { [index: string]: Component }> = new Map();
    protected components: Map<CLASS<Component>, Set<Entity>> = new Map();
    protected systems: System[] = [];
    protected deferments: Array<{ func: Function, args: any[] }> = [];
    protected pubcoms: Map<CLASS<Component>, Component> = new Map();
    protected lastupdate: number = present();
    protected running: boolean = false;
    protected watch_open: boolean = false;
    protected watch_compts: Set<CLASS<Component>> = new Set();
    protected watch_filters: Map<IFilter, Set<CLASS<Component>>> = new Map();
    protected watch_ents: Map<IFilter, Set<Entity>> = new Map();
    protected watch_cid: Map<CLASS<Component>, number> = new Map();
    protected watch_fid: Map<IFilter, IFilterID> = new Map();
    protected next_cid: number = 0;

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
     * Public component is Singleton pattern. It used for share data between Systems , but not for assigning to entity.
     *
     * @param c A Component object
     */
    public SetPubComponent(c: Component) {
        this.pubcoms.set(c.constructor as CLASS<Component>, c);
    }

    /**
     * Get a public component.
     * See EntityAdmin.SetPubComponent().
     *
     * @template T
     * @param {CLASS<T>} cclass A component class name.
     * @returns {(undefined | T)}
     * @memberof EntityAdmin
     */
    public GetPubComponent<T extends Component>(cclass: CLASS<T>): undefined | T {
        return this.pubcoms.get(cclass) as undefined | T;
    }

    /**
     * Actually the same as EntityAdmin.GetPubComponent(), but returns by a type assertion.
     * If you are sure this type of component exist, call this method maybe better than EntityAdmin.GetPubComponent().
     * The return type does not union undefined.
     *
     * @template T
     * @param {CLASS<T>} cclass A component class name.
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
     * @param {Function} func A function to deal delayed things.
     * @param {...any} args parameter list for func
     * @memberof EntityAdmin
     */
    public PushDeferment(func: Function, ...args: any) {
        this.deferments.push({ func, args });
    }

    /**
     * Add a System, generally be called before EntityAdmin.start().
     *
     * @param {CLASS<System>} sclass a system class name
     * @param {number} [priority=0] Bigger number means higher priority. Priority determines the order of updating systems.
     * @memberof EntityAdmin
     */
    public AddSystem(sclass: CLASS<System>, priority: number = 0) {
        this.systems.push(new sclass(this, priority));
        this.systems.sort((a: System, b: System) => {
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
                s.Update(delta);
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
     * @returns {Entity} Identification for entity. It's a number actually.
     * @memberof EntityAdmin
     */
    public CreateEntity(...args: Component[]): Entity {
        const new_ent = ++this.next_entity;
        this.entities.set(new_ent, {});
        this.AssignComponents(new_ent, ...args);
        return new_ent;
    }

    /**
     * Delete an Entity. And components the entity owns will be removed at the same time.
     *
     * @param {Entity} e The entity identification.
     * @memberof EntityAdmin
     */
    public DeleteEntity(e: Entity): void {
        const coms = this.entities.get(e);
        if (coms) {
            // tslint:disable-next-line:forin
            for (const cname in coms) {
                const set = this.components.get(coms[cname].constructor as CLASS<Component>);
                if (set) {
                    set.delete(e);
                }
            }
            this.entities.delete(e);
        }
    }

    public ClearAllEntity() {
        this.entities.clear();
        this.components.clear();
        if (this.watch_open) {
            for (const set of this.watch_ents.values()) {
                set.clear();
            }
        }
    }

    /**
     * Get an entity's component object.
     *
     * @template T
     * @param {Entity} entity An entity's identification. It's a number actually.
     * @param {CLASS<T>} cclass Component class name.
     * @returns {(T | undefined)} The target type component object. If not exist the entity or the entity did not own this type component, return undefined.
     * @memberof EntityAdmin
     */
    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities.get(entity);
        if (coms) {
            return coms[cclass.name] as T;
        }
    }

    /**
     * Identify an entity exist or not.
     *
     * @param {Entity} e The entity ID.
     * @returns {boolean} Return true means the entity exist.
     * @memberof EntityAdmin
     */
    public ValidEntity(e: Entity): boolean {
        return this.entities.has(e);
    }

    /**
     * Assign component objects to an entity. If you assign the same type component object to a entity, the latter will replace the former.
     *
     * @param {Entity} e The entity ID.
     * @param {...Component[]} cs Component object list.
     * @memberof EntityAdmin
     */
    public AssignComponents(e: Entity, ...cs: Component[]): void {
        const coms = this.entities.get(e);
        if (coms) {
            let watch_list: Array<CLASS<Component>> | undefined;
            if (this.watch_open) {
                watch_list = [];
            }
            for (const c of cs) {
                if (c.entity) {
                    throwError(`${c.constructor.name} has been assign to ${c.entity}, cannot assign to ${e} repeatedly.`);
                }
                const cls = c.constructor as CLASS<Component>;

                let set = this.components.get(cls);
                if (!set) {
                    set = new Set();
                    this.components.set(cls, set);
                }
                set.add(e);
                (c as any).m_entity = e;
                if (watch_list && !coms[cls.name]) {
                    watch_list.push(cls);
                }
                coms[cls.name] = c;
            }
            if (watch_list && watch_list.length > 0) {
                this.WatchComponent(e, watch_list);
            }
        }
    }

    /**
     * Remove component object from an entity.
     * If the entity or components do not exist, this method just do nothing, won't throw error.
     *
     * @template T
     * @param {Entity} e The entity ID.
     * @param {...Array<CLASS<T>>} cclass A list of component class name.
     * @memberof EntityAdmin
     */
    public RemoveComponents<T extends Component>(e: Entity, ...cclass: Array<CLASS<T>>) {
        const coms = this.entities.get(e);
        if (coms) {
            for (const c of cclass) {
                delete coms[c.name];
            }
        }
        let watch_list: Array<CLASS<Component>> | undefined;
        if (this.watch_open) {
            watch_list = [];
        }
        for (const c of cclass) {
            const set = this.components.get(c);
            if (set) {
                const ret = set.delete(e);
                if (watch_list && ret) {
                    watch_list.push(c);
                }
            }
        }
        if (watch_list && watch_list.length > 0) {
            this.WatchComponent(e, watch_list);
        }
    }

    /**
     * Determine whether the entity owns the specified type component.
     * If this entity does not exist, returns false.
     *
     * @param {Entity} e The entity ID.
     * @param {CLASS<Component>} c Component class name.
     * @returns {boolean}
     * @memberof EntityAdmin
     */
    public HasComponent(e: Entity, c: CLASS<Component>): boolean {
        const coms = this.entities.get(e);
        if (coms && coms[c.name]) {
            return true;
        }
        return false;
    }

    /**
     * Returns an iterable of components by an specified type.
     *
     * @template T
     * @param {CLASS<T>} cclass Component class name.
     * @returns {IterableIterator<T>}
     * @memberof EntityAdmin
     */
    public *GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        const set = this.components.get(cclass);
        if (set) {
            for (const e of set.values()) {
                const coms = this.entities.get(e);
                if (coms && coms[cclass.name]) {
                    yield coms[cclass.name] as T;
                }
            }
        }
    }

    /**
     * Returns an iterable of components by the first type you give. In this case, you can use EntityAdmin.SureSibling() to get other type components.
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
     * @param {...[CLASS<T>, ...Array<CLASS<Component>>]} cclass A list of component class name. Give one or more component types.
     * @returns {IterableIterator<T>}
     * @memberof EntityAdmin
     */
    public *GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ...Array<CLASS<Component>>]): IterableIterator<T> {
        interface ICInfo { type: CLASS<Component>; len: number; }
        if (cclass.length <= 1) {
            return this.GetComponents(cclass[0]);
        }
        const T_type = cclass[0];
        const length_info: ICInfo[] = [];
        for (const c of cclass) {
            const set = this.components.get(c);
            if (!set) {
                return;
            }
            length_info.push({ type: c, len: set.size });
        }
        length_info.sort((a, b) => {
            return a.len - b.len;
        });
        const top = length_info.shift() as ICInfo;
        for (const c1 of this.GetComponents(top.type)) {
            let pass = true;
            for (const info of length_info) {
                if (!this.GetComponentByEntity(c1.entity, info.type)) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                yield this.GetComponentByEntity(c1.entity, T_type) as T;
            }
        }
    }

    public AddWatchings(...fts: [IFilter, ...IFilter[]]) {
        if (this.entities.size > 0) {
            throwError("AddWatching should be used before CreateEntity");
        }
        if (!this.watch_open) { this.watch_open = true; }
        for (const f of fts) {
            if (!this.watch_filters.has(f)) {
                this.watch_filters.set(f, new Set());
            }
            for (const c of FilterComponents(f)) {
                this.watch_compts.add(c);
                (this.watch_filters.get(f) as Set<CLASS<Component>>).add(c);
                // generate component id
                if (!this.watch_cid.has(c)) {
                    this.watch_cid.set(c, this.next_cid);
                    this.next_cid += 1;
                }
            }
            // generate filter id
            if (!this.watch_fid.has(f)) {
                let all_id = 0;
                let none_id = 0;
                let any_id = 0;
                if (f.all_of) {
                    for (const c of f.all_of) {
                        all_id |= 1 << this.getcid(c);
                    }
                }
                if (f.any_of) {
                    for (const c of f.any_of) {
                        any_id |= 1 << this.getcid(c);
                    }
                }
                if (f.none_of) {
                    for (const c of f.none_of) {
                        none_id |= 1 << this.getcid(c);
                    }
                }
                this.watch_fid.set(f, { all_id, none_id, any_id });
            }
            if (!this.watch_ents.has(f)) {
                this.watch_ents.set(f, new Set());
            }
        }
    }

    public GetComponentsByIndex<T extends Component>(entity: Entity, cclass: CLASS<T>): T {
        return this.GetComponentByEntity(entity, cclass) as T;
    }

    public *GetIndexsByFilter(f: IFilter): IterableIterator<Entity> {
        const set = this.watch_ents.get(f);
        if (set) {
            for (const ent of set.values()) {
                yield ent;
            }
        }
    }

    public MatchCountByFilter(f: IFilter): number {
        const set = this.watch_ents.get(f);
        if (set) {
            return set.size;
        }
        return 0;
    }

    protected getcid(c: CLASS<Component>): number {
        // should confirm c in watch_cid when call this method
        return this.watch_cid.get(c) as number;
    }

    protected WatchComponent(e: Entity, cls: Array<CLASS<Component>>) {
        for (const fobj of this.watch_ents.keys()) {
            if (FilterMatch(this, fobj, e)) {
                (this.watch_ents.get(fobj) as Set<Entity>).add(e);
            } else {
                (this.watch_ents.get(fobj) as Set<Entity>).delete(e);
            }
        }
    }
}
