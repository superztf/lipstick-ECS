import { Component } from "./component";
import { System } from "./system";
import { present, CLASS } from "./utils";

export type Entity = number;

export class EntityAdmin {
    private next_entity: Entity = 0;
    private entities: Map<Entity, { [index: string]: Component }> = new Map();
    private components: { [index: string]: Set<Entity> } = {};
    private systems: System[] = [];
    private deferments: Array<{ func: Function, args: any[] }> = [];
    private pubcoms: { [index: string]: Component } = {};
    private lastupdate: number = present();
    private running = false;

    public start(curtime?: number): void {
        this.lastupdate = curtime === undefined ? present() : curtime;
        this.running = true;
    }

    public stop(): void {
        this.running = false;
    }

    public SetPubComponent(c: Component) {
        this.pubcoms[c.constructor.name] = c;
    }

    public GetPubComponent<T extends Component>(cclass: CLASS<T>): undefined | T {
        return this.pubcoms[cclass.name] as T;
    }

    public SurePubComponent<T extends Component>(cclass: CLASS<T>): T {
        return this.pubcoms[cclass.name] as T;
    }

    public PushDeferment(func: Function, ...args: any) {
        this.deferments.push({ func, args });
    }

    // bigger number means higher priority
    public AddSystem(sclass: CLASS<System>, priority: number = 0) {
        this.systems.push(new sclass(this, priority));
        this.systems.sort((a: System, b: System) => {
            return b.priority - a.priority;
        });
    }

    public UpdateSystems(nowtime?: number) {
        if (this.running) {
            const now = nowtime ? nowtime : present();
            const delta = now - this.lastupdate;
            this.lastupdate = now;
            for (const s of this.systems) {
                s.Update(delta);
            }
            for (const delay of this.deferments) {
                delay.func(...delay.args);
            }
            this.deferments = [];
        }
    }

    public CreateEntity(...args: Component[]): Entity {
        const new_ent = ++this.next_entity;
        this.entities.set(new_ent, {});
        this.AssignComponents(new_ent, ...args);
        return new_ent;
    }

    public DeleteEntity(e: Entity): void {
        const coms = this.entities.get(e);
        if (coms) {
            for (const cname in coms) {
                if (this.components[cname]) {
                    this.components[cname].delete(e);
                }
            }
            this.entities.delete(e);
        }
    }

    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities.get(entity);
        if (coms) {
            return coms[cclass.name] as T;
        }
    }

    public ValidEntity(e: Entity): boolean {
        return this.entities.has(e);
    }

    public AssignComponents(e: Entity, ...cs: Component[]): void {
        const coms = this.entities.get(e);
        if (coms) {
            for (const c of cs) {
                coms[c.constructor.name] = c;
                if (!this.components[c.constructor.name]) {
                    this.components[c.constructor.name] = new Set();
                }
                this.components[c.constructor.name].add(e);
                (c as any).m_entity = e;
            }
        }
    }

    public RemoveComponents<T extends Component>(e: Entity, ...cclass: Array<CLASS<T>>) {
        const coms = this.entities.get(e);
        if (coms) {
            for (const c of cclass) {
                delete coms[c.name];
            }
        }
        for (const c of cclass) {
            if (this.components[c.name]) {
                this.components[c.name].delete(e);
            }
        }
    }

    public HasComponet(e: Entity, c: CLASS<Component>): boolean {
        const coms = this.entities.get(e);
        if (coms && coms[c.name]) {
            return true;
        }
        return false;
    }

    public *GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        if (this.components[cclass.name]) {
            for (const e of this.components[cclass.name].values()) {
                const coms = this.entities.get(e);
                if (coms && coms[cclass.name]) {
                    yield coms[cclass.name] as T;
                }
            }
        }
    }

    public *GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ...Array<CLASS<Component>>]): IterableIterator<T> {
        interface ICInfo { type: CLASS<Component>; len: number; }
        if (cclass.length <= 1) {
            return this.GetComponents(cclass[0]);
        }
        const T_type = cclass[0];
        const length_info: ICInfo[] = [];
        for (const c of cclass) {
            if (!this.components[c.name]) {
                return;
            }
            length_info.push({ type: c, len: this.components[c.name].size });
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
}
