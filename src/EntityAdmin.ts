import { Component } from "./component";
import { System } from "./system";

export type Entity = number;
export type ComponentName = string;
type CLASS<T> = new (...args: any) => T;

const logger = console;

export const G_ENTITY: Entity = 0;

export class EntityAdmin {
    private next_entity: Entity = 0;
    private entities: { [index: number]: { [index: string]: Component } } = {};
    private dead_ents: Set<Entity> = new Set();
    private components: { [index: string]: Set<Entity> } = {};
    private systems: System[] = [];

    // bigger number means higher priority
    public AddSystem(sclass: CLASS<System>, priority: number = 0) {
        this.systems.push(new sclass(this, priority));
        this.systems.sort((a: System, b: System) => {
            return b.priority - a.priority;
        });
    }

    public UpdateSystems(timeDelta: number) {
        for (const s of this.systems) {
            s.Update(timeDelta);
        }
    }

    public CreateEntity(...args: Component[]): Entity {
        const new_ent = ++this.next_entity;
        this.entities[new_ent] = {};
        this.AssignComponent(new_ent, ...args);
        return new_ent;
    }

    public DeleteEntity(e: Entity, immediate = true): void {
        if (this.ValidEntity(e)) {
            if (immediate) {
                this.delete_ent(e);
            } else {
                this.dead_ents.add(e);
            }
        }
    }

    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities[entity];
        if (coms) {
            return coms[cclass.name] as T;
        }
    }

    public ValidEntity(e: Entity): boolean {
        if (this.dead_ents.has(e) || !this.entities[e]) {
            return false;
        }
        return true;
    }

    public BeforeAssignComponent(e: Entity, c: Comment) {

    }

    public AssignComponent(e: Entity, ...cs: Component[]): void {
        if (this.ValidEntity(e)) {
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

    public AfterAssignComponent(e: Entity, c: Comment) {

    }

    public BeforeRemoveComponent(e: Entity, c: Comment) {

    }

    public RemoveComponent<T extends Component>(e: Entity, cclass: CLASS<T>) {
        if (this.entities[e]) {
            delete this.entities[e][cclass.name];
        }
        if (this.components[cclass.name]) {
            this.components[cclass.name].delete(e);
        }

    }

    public AfterRemoveComponent(e: Entity, c: Comment) {

    }

    public HasComponet(e: Entity, c: Component): boolean {
        if (this.entities[e]) {
            if (this.entities[e][c.constructor.name]) {
                return true;
            }
        }
        return false;
    }

    public *GetComponents<T extends Component>(cclass: CLASS<T>): IterableIterator<T> {
        if (this.components[cclass.name]) {
            for (const e of this.components[cclass.name].values()) {
                if (this.entities[e] && this.entities[e][cclass.name]) {
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

    private delete_ent(e: Entity) {
        for (const cname in this.entities[e]) {
            if (this.components[cname]) {
                this.components[cname].delete(e);
            }
        }
        delete this.entities[e];
    }
}
