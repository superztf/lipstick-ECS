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

    public start(curtime: number = present()): void {
        this.lastupdate = curtime;
        this.running = true;
    }

    public stop(): void {
        this.running = false;
    }

    public SetPubComponent(c: Component) {
        this.pubcoms.set(c.constructor as ComponentType, c);
    }

    public GetPubComponent<T extends Component>(cclass: CLASS<T>): undefined | T {
        return this.pubcoms.get(cclass) as undefined | T;
    }

    public SurePubComponent<T extends Component>(cclass: CLASS<T>): T {
        return this.pubcoms.get(cclass) as T;
    }

    public PushDeferment(func: Function, ...args: any) {
        this.deferments.push({ func, args });
    }

    public AddSystem(system: SystemType, priority: number = 0) {
        this.systems.push({ system, priority });
        this.systems.sort((a, b) => {
            return b.priority - a.priority;
        });
    }

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

    public CreateEntity(...args: Component[]): Entity {
        const new_ent = ++this.next_entity;
        this.entities.set(new_ent, new Map());
        if (args.length > 0) {
            this.AssignComponents(new_ent, ...args);
        }
        return new_ent;
    }

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

    public ClearAllEntity() {
        for (const e of this.entities.keys()) {
            this.DeleteEntity(e);
        }
    }

    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities.get(entity);
        if (coms) {
            return coms.get(cclass) as T;
        }
    }

    public ValidEntity(e: Entity): boolean {
        return this.entities.has(e);
    }

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
                        let cidmap: number = 0;
                        const oldcid = this.entity_cidmap.get(e);
                        if (oldcid) {
                            cidmap = oldcid;
                        }
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

    public HasComponent(e: Entity, c: ComponentType): boolean {
        const coms = this.entities.get(e);
        if (coms && coms.has(c)) {
            return true;
        }
        return false;
    }

    public GetComponents<T extends Component>(cclass: CLASS<T>): Set<T> {
        const compts = this.comptcontain.get(cclass);
        if (compts) {
            return compts as Set<T>;
        } else {
            return new Set();
        }
    }

    public GetComponentSize(cclass: ComponentType): number {
        const compts = this.comptcontain.get(cclass);
        if (compts) {
            return compts.size;
        } else {
            return 0;
        }
    }

    public GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ...ComponentType[]]): Set<Component> {
        if (cclass.length <= 1) {
            return this.GetComponents(cclass[0]);
        }
        const cache = this.tryGetTupleCache(cclass);
        if (cache) {
            return cache;
        }
        interface ICInfo { type: CLASS<Component>; len: number; }
        const top = cclass[0];
        const length_info: ICInfo[] = [];
        for (const c of cclass) {
            const set = this.comptowners.get(c);
            if (!set) {
                return new Set();
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
        return list;
    }

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

    public GetComponentByIndex<T extends Component>(entity: Entity, cclass: CLASS<T>): T {
        const coms = this.entities.get(entity);
        return (coms as Map<ComponentType, Component>).get(cclass) as T;
    }

    public GetIndexsByFilter(f: IFilter): Set<Entity> {
        const set = this.watch_ents.get(f);
        if (set) {
            return set;
        } else {
            return new Set();
        }
    }

    public MatchCountByFilter(f: IFilter): number {
        const set = this.watch_ents.get(f);
        if (set) {
            return set.size;
        }
        return 0;
    }

    public matchFilter(e: Entity, fobj: IFilter): boolean {
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
