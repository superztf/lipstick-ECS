import { EntityAdmin, Entity } from "../src/EntityAdmin";
import { Component } from "../src/component";
import { System } from "../src/system";

const logger = console;

class ComponentA extends Component {
    public attr1 = 0;
}

class ComponentB extends Component {
    public attr1 = 0;
    public attr2 = "hello";
}

class ComponentC extends Component {
    public attr1: number;
    public attr2: string;
    public attr3 = null;
    constructor(a: number, b: string) {
        super();
        this.attr1 = a;
        this.attr2 = b;
    }
}

class SystemA extends System {
    public Update(timeStep: number): void {
    }
}

describe("ecs test", () => {
    const admin = new EntityAdmin();
    it("create entity", () => {
        const e1 = admin.CreateEntity();
        const e2 = admin.CreateEntity(new ComponentB());
        const e3 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(1, "world"));
        expect(e1 + 1).toBe(e2);
        expect(e2 + 1).toBe(e3);
        expect(admin.ValidEntity(e1)).toBe(true);
        expect(admin.ValidEntity(e2)).toBe(true);
        expect(admin.ValidEntity(e3)).toBe(true);
    });
    it("delete entity", () => {
        const key = "delete entity";
        const e1 = admin.CreateEntity(new ComponentB(), new ComponentC(1, key));
        expect(admin.ValidEntity(e1)).toBe(true);
        let iFindComponentC = false;
        for (const c of admin.GetComponents(ComponentC)) {
            if (c.attr2 === key) {
                iFindComponentC = true;
                break;
            }
        }
        expect(iFindComponentC).toBe(true);

        admin.DeleteEntity(e1);
        iFindComponentC = false;
        for (const c of admin.GetComponents(ComponentC)) {
            if (c.attr2 === key) {
                iFindComponentC = true;
                break;
            }
        }
        expect(iFindComponentC).toBe(false);
        expect(admin.ValidEntity(e1)).toBe(false);
    });
    it("assgin component", () => {
        const key = 2333;
        const e = admin.CreateEntity();
        admin.AssignComponents(e, new ComponentC(key, "world"));
        const c = admin.GetComponentByEntity(e, ComponentC);
        if (c) {
            expect(c.attr1).toBe(key);
        } else {
            throw (new Error("assgin component err: expect ComponentC"));
        }
    });
    it("add system", () => {
        admin.AddSystem(SystemA, 3);
        admin.AddSystem(SystemA, 1);
        admin.AddSystem(SystemA, 2);
        admin.AddSystem(SystemA);
        let i = 3;
        for (const s of (admin as any).systems as SystemA[]) {
            expect(s.priority).toBe(i);
            --i;
        }
        admin.UpdateSystems();
    });
    it("public components", () => {
        const n = 666;
        expect(admin.GetPubComponent(ComponentC)).toBeUndefined();
        admin.SetPubComponent(new ComponentC(n, ""));
        const c = admin.GetPubComponent(ComponentC);
        if (c) {
            expect(c.attr1).toBe(n);
        } else {
            throw (new Error("public components err: expect ComponentC"));
        }
    });
    it("push deferment", () => {
        let value = 0;
        const delay_do = (a: number, b: number) => { value += (a + b); };
        admin.PushDeferment(delay_do, 2, 5);
        admin.start();
        expect(value).toBe(0);
        admin.UpdateSystems();
        expect(value).toBe(7);
        admin.UpdateSystems();
        expect(value).toBe(7);
    });
    it("component method", () => {
        const coma = new ComponentA();
        const key = 32546;
        admin.CreateEntity(coma, new ComponentC(key, ""));
        const comc = coma.GetSibling(admin, ComponentC);
        if (comc) {
            expect(comc.attr1).toBe(key);
        } else {
            throw (new Error("component method err:ComponentC should be exist"));
        }

        expect(coma.GetSibling(admin, ComponentB)).toBeUndefined();
        coma.AddSibling(admin, new ComponentB());
        expect(!!coma.GetSibling(admin, ComponentB)).toBeTruthy();
        coma.RemoveSibling(admin, ComponentB);
        expect(!!coma.GetSibling(admin, ComponentB)).toBeFalsy();
    });
});
