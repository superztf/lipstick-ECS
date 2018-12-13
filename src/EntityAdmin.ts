import { Component } from "./component";
import { Match } from "./Match";
export type Entity = number;
export type ComponentName = string;
type CLASS<T> = new (...args: any) => T;

const logger = console;

export const G_ENTITY: Entity = 0;

export class EntityAdmin {
    private components: { [index: string]: Set<Entity> } = {};
    private next_entity: Entity = 0;
    private entities: { [index: number]: { [index: string]: Component } } = {};

    public CreateEntity(...args: Component[]): Entity {
        const new_ent = ++this.next_entity;
        this.entities[new_ent] = {};
        this.AssignComponent(new_ent, ...args);
        return new_ent;
    }

    public GetComponentByEntity<T extends Component>(entity: Entity, cclass: CLASS<T>): T | undefined {
        const coms = this.entities[entity];
        if (coms) {
            return coms[cclass.name] as T;
        }
    }

    public ValidEntity(e: Entity): boolean {
        return !!this.entities[e];
    }

    public BeforeAssignComponent(e: Entity, c: Comment) {

    }

    public AssignComponent(e: Entity, ...cs: Component[]): void {
        if (this.ValidEntity(e)) {
            for (let c of cs) {
                this.entities[e][c.constructor.name] = c;
                if (!this.components[c.constructor.name]) {
                    this.components[c.constructor.name] = new Set();
                }
                this.components[c.constructor.name].add(e);
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
            for (let e of this.components[cclass.name].values()) {
                if (this.entities[e] && this.entities[e][cclass.name]) {
                    yield this.entities[e][cclass.name] as T;
                }
            }
        }
    }

    // public *GetComponentTuple<C1, C2>(...cclass: (new () => Component)[]): IterableIterator<[C1, C2]>;
    // public *GetComponentTuple<C1>(...cclass: (new () => Component)[]): IterableIterator<[C1]>;
    public *GetComponentsByTuple<T extends Component>(...cclass: [CLASS<T>, ...CLASS<Component>[]]): IterableIterator<T> {
        type CInfo = { type: CLASS<Component>, len: number };
        if (cclass.length <= 1) {
            return this.GetComponents(cclass[0]);
        }
        const T_type = cclass[0];
        let length_info: CInfo[] = [];
        for (let c of cclass) {
            if (!this.components[c.name]) {
                return;
            }
            length_info.push({ type: c, len: this.components[c.name].size })
        }
        length_info.sort((a, b) => {
            return a.len - b.len;
        });
        const top = length_info.shift() as CInfo;
        for (let c1 of this.GetComponents(top.type)) {
            let pass = true;
            for (let info of length_info) {
                if (!this.GetComponentByEntity(c1.entity, info.type)) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                yield c1 as T;
            }
        }
    }
}
