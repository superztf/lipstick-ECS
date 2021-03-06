import { EntityAdmin } from "../src/EntityAdmin";
import { Component } from "../src/component";
import { System } from "../src/system";
import { SystemType } from "../src/utils";

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

class ComponentD extends Component {
    public attr1: number;
    public marked = false;
    constructor(n: number) {
        super();
        this.attr1 = n;
    }
}

class ComponentE extends Component {

}

class SystemA extends System {
    public static Update(admin: EntityAdmin, timeStep: number): void {
        for (const c of admin.GetComponentsByTuple(ComponentA)) {

        }
    }
}

class SystemB extends System {
    public static Update(admin: EntityAdmin, delta: number): void {
        for (const a of admin.GetComponentsByTuple(ComponentA, ComponentB, ComponentC, ComponentD)) {
            const c = a.GetSibling(ComponentC);
            const d = a.GetSibling(ComponentD);
            if (c && c.attr1 % 2 === 0) {
                c.RemoveSibling(ComponentB);
            }
            if (d && c && d.attr1 % 2 === 0) {
                c.attr2 = d.attr1.toString();
            }
            if (d) {
                d.marked = true;
            }
        }
    }
}

class SystemC extends System {
    public static Update(admin: EntityAdmin, timeStep: number): void {
        for (const c of admin.GetComponentsByTuple(ComponentA, ComponentE)) {

        }
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
        admin.ClearAllEntity();
        const key = 2333;
        const e = admin.CreateEntity();
        expect(admin.HasComponent(e, ComponentC)).toBeFalsy();
        expect(admin.GetComponentSize(ComponentC)).toBe(0);
        admin.AssignComponents(e, new ComponentC(key, "world"));
        expect(admin.HasComponent(e, ComponentC)).toBeTruthy();
        expect(admin.GetComponentSize(ComponentC)).toBe(1);
        const c = admin.GetComponentByEntity(e, ComponentC);
        if (c) {
            expect(c.attr1).toBe(key);
        } else {
            throw (new Error("assgin component err: expect ComponentC"));
        }
        const newc = new ComponentA();
        admin.CreateEntity(newc);
        expect(() => {
            admin.AssignComponents(e, newc);
        }).toThrowError(/^ECS-ERROR:/);

        // assgin the same type component
        admin.AssignComponents(e, new ComponentC(key, "world"));
        admin.AssignComponents(e, new ComponentC(key, "world"));
    });
    it("remove component", () => {
        const e = admin.CreateEntity();
        admin.AssignComponents(e, new ComponentC(1, "world"));
        admin.RemoveComponents(e, ComponentC, ComponentC);
    });
    it("add system", () => {
        admin.AddSystem(SystemA, 3);
        admin.AddSystem(SystemA, 1);
        admin.AddSystem(SystemA, 2);
        admin.AddSystem(SystemA);
        let i = 3;
        for (const s of (admin as any).systems as Array<{ priority: number, system: SystemType }>) {
            expect(s.priority).toBe(i);
            --i;
        }
        admin.AddSystem(SystemC);
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
        const c2 = admin.SurePubComponent(ComponentC);
        expect(c.attr1).toBe(n);
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
        const comc = coma.GetSibling(ComponentC);
        if (comc) {
            expect(comc.attr1).toBe(key);
        } else {
            throw (new Error("component method err:ComponentC should be exist"));
        }

        expect(coma.GetSibling(ComponentB)).toBeUndefined();
        coma.AddSibling(new ComponentB());
        expect(!!coma.GetSibling(ComponentB)).toBeTruthy();
        expect(!!coma.SureSibling(ComponentB)).toBeTruthy();
        coma.RemoveSibling(ComponentB);
        expect(!!coma.GetSibling(ComponentB)).toBeFalsy();
    });
    it("system update", () => {
        admin.stop();
        admin.AddSystem(SystemB);
        admin.start(Date.now());

        const e1 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(100, ""));

        const e2 = admin.CreateEntity(new ComponentC(100, ""), new ComponentB(), new ComponentD(100));
        const e3 = admin.CreateEntity(new ComponentA(), new ComponentC(100, ""), new ComponentD(100));
        const e4 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentD(100)); // you b

        const e5 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(100, ""), new ComponentD(100)); // wb
        const e6 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(100, ""), new ComponentD(100)); // wb
        const e7 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(101, ""), new ComponentD(100)); // yb
        const e8 = admin.CreateEntity(new ComponentA(), new ComponentB(), new ComponentC(101, ""), new ComponentD(100)); // yb
        admin.UpdateSystems(1);

        const cd2 = admin.GetComponentByEntity(e2, ComponentD);
        if (cd2) {
            expect(cd2.marked).toBeFalsy();
        } else {
            throw (new Error("system update err"));
        }
        const cd3 = admin.GetComponentByEntity(e3, ComponentD);
        if (cd3) {
            expect(cd3.marked).toBeFalsy();
        } else {
            throw (new Error("system update err"));
        }
        const cd4 = admin.GetComponentByEntity(e4, ComponentD);
        if (cd4) {
            expect(cd4.marked).toBeFalsy();
            expect(!!cd4.GetSibling(ComponentB)).toBeTruthy();
        } else {
            throw (new Error("system update err"));
        }
        const cd5 = admin.GetComponentByEntity(e5, ComponentD);
        if (cd5) {
            expect(cd5.marked).toBeTruthy();
            expect(!!cd5.GetSibling(ComponentB)).toBeFalsy();
        } else {
            throw (new Error("system update err"));
        }
        const cd6 = admin.GetComponentByEntity(e6, ComponentD);
        if (cd6) {
            expect(cd6.marked).toBeTruthy();
            expect(!!cd6.GetSibling(ComponentB)).toBeFalsy();
        } else {
            throw (new Error("system update err"));
        }
        const cd7 = admin.GetComponentByEntity(e7, ComponentD);
        if (cd7) {
            expect(cd7.marked).toBeTruthy();
            expect(!!cd7.GetSibling(ComponentB)).toBeTruthy();
        } else {
            throw (new Error("system update err"));
        }
        const cd8 = admin.GetComponentByEntity(e8, ComponentD);
        if (cd8) {
            expect(cd8.marked).toBeTruthy();
            expect(!!cd8.GetSibling(ComponentB)).toBeTruthy();
        } else {
            throw (new Error("system update err"));
        }
        admin.UpdateSystems(1);
        admin.UpdateSystems(1);
        admin.UpdateSystems(1);
        admin.UpdateSystems(1);
    });
    it("fix coverage", () => {
        class TEST extends Component {
        }
        for (const c of admin.GetComponents(TEST)) {
        }
        admin.AssignComponents(-1);
        admin.GetComponentByEntity(-1, TEST);
        admin.DeleteEntity(-1);
        admin.RemoveComponents(-1);

        const e1 = admin.CreateEntity();
        class NewCompt1 extends Component { }
        admin.RemoveComponents(e1, NewCompt1);
        admin.GetComponentSize(NewCompt1);
        expect(() => {
            System.Update(admin, 1);
        }).toThrowError(/^ECS-ERROR:/);
    });
});
