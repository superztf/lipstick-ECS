import { Component } from "./component";
import { System } from "./system";
import { present, CLASS } from "./utils";

export type Entity = number;
export type ComponentName = string;

const logger = console;

export class EntityAdmin {
    private next_entity: Entity = 0;
    private entities: { [index: number]: { [index: string]: Component } } = { 0: {} };
    private components: { [index: string]: Set<Entity> } = {};
    private systems: System[] = [];
    private deferments: Array<{ func: Function, args: any[] }> = [];
    private pubcoms: { [index: string]: Component } = {};
    private lastupdate: number = present();
    private running = false;

    public start(): void {
        this.lastupdate = present();
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

    public UpdateSystems() {
        if (this.running) {
            const now = present();
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
        this.entities[new_ent] = {};
        this.AssignComponents(new_ent, ...args);
        return new_ent;
    }

    public DeleteEntity(e: Entity, immediate = true): void {
        if (this.ValidEntity(e)) {
            for (const cname in this.entities[e]) {
                if (this.components[cname]) {
                    this.components[cname].delete(e);
                }
            }
            delete this.entities[e];
        }
    }

    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities[entity];
        if (coms) {
            return coms[cclass.name] as T;
        }
    }

    public ValidEntity(e: Entity): boolean {
        if (this.entities[e]) {
            return true;
        }
        return false;
    }

    public AssignComponents(e: Entity, ...cs: Component[]): void {
        if (this.entities[e]) {
            for (const c of cs) {
                this.entities[e][c.constructor.name] = c;
                if (!this.components[c.constructor.name]) {
                    this.components[c.constructor.name] = new Set();
                }
                this.components[c.constructor.name].add(e);
                (c as any).m_entity = e;
            }
        } else {
            logger.error(`assign ${cs} to a invalid entity ${e}`);
        }
    }

    public RemoveComponents<T extends Component>(e: Entity, ...cclass: Array<CLASS<T>>) {
        if (this.entities[e]) {
            for (const c of cclass) {
                delete this.entities[e][c.name];
            }
        }
        for (const c of cclass) {
            if (this.components[c.name]) {
                this.components[c.name].delete(e);
            }
        }
    }

    public HasComponet(e: Entity, c: Component): boolean {
        if (this.entities[e] && this.entities[e][c.constructor.name]) {
            return true;
        }
        return false;
    }

    public *GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        if (this.components[cclass.name]) {
            for (const e of this.components[cclass.name].values()) {
                if (this.ValidEntity(e) && this.entities[e][cclass.name]) {
                    yield this.entities[e][cclass.name] as T;
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
