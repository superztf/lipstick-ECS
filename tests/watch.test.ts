import { EntityAdmin, Entity } from "../src/EntityAdmin";
import { SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG } from "./components";
import { Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7 } from "./filters";
import { IFilter, CLASS } from "../src/utils";
import { Component } from "../src/component";
function RandomInt(min = 5, max = 50) {
    return Math.round(Math.random() * (max - min) + min);
}

function RunTimes(n: number, f: Function) {
    for (let i = 0; i < n; ++i) {
        f();
    }
}

const admin = new EntityAdmin();

function make() {
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptC());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptF());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptE());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptF());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptD());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptB(), new SimpleComptE());
    });
    RunTimes(RandomInt(), () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptE(), new SimpleComptF());
    });
}

describe("test watch funtion", () => {

    it("AddWatching", () => {
        admin.CreateEntity();
        admin.CreateEntity();
        admin.CreateEntity();
        expect(() => {
            admin.AddWatchings(Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7);
        }).toThrowError(/^ECS-ERROR:/);
        admin.ClearAllEntity();
        admin.AddWatchings(Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7);
    });
    it("MatchCountByFilter", () => {
        admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
        expect(admin.MatchCountByFilter(Match_7)).toBe(1);
        const new_match_7 = JSON.parse(JSON.stringify(Match_7));
        expect(admin.MatchCountByFilter(new_match_7)).toBe(0);

    });
    it("FilterMatch", () => {
        const e = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
        expect(admin.matchFilter(e, Match_1)).toBeTruthy();
        expect(admin.matchFilter(e, Match_2)).toBeFalsy();
        expect(admin.matchFilter(e, Match_3)).toBeTruthy();
        expect(admin.matchFilter(e, Match_4)).toBeTruthy();
        expect(admin.matchFilter(e, Match_5)).toBeFalsy();
        expect(admin.matchFilter(e, Match_6)).toBeFalsy();
        expect(admin.matchFilter(e, Match_7)).toBeTruthy();
        admin.ClearAllEntity();
    });
    it("GetIndexsByFilter", () => {
        admin.ClearAllEntity();
        function get_ents(f: IFilter) {
            const list = [];
            for (const ent of admin.GetIndexsByFilter(f)) {
                list.push(ent);
            }
            list.sort();
            return list;
        }

        function has_compts(e: Entity, ...cclass: Array<CLASS<Component>>) {
            for (const c of cclass) {
                if (!admin.GetComponentByIndex(e, c)) {
                    return false;
                }
            }
            return true;
        }

        function has_not_compts(e: Entity, ...cclass: Array<CLASS<Component>>) {
            for (const c of cclass) {
                if (admin.GetComponentByIndex(e, c)) {
                    return false;
                }
            }
            return true;
        }

        const e1 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC());
        const e2 = admin.CreateEntity(new SimpleComptA());
        const e3 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
        const e4 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD(), new SimpleComptE());
        const e5 = admin.CreateEntity(new SimpleComptD(), new SimpleComptE());
        const e6 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptG());

        let m1 = [e1, e3, e4, e6].sort();
        let m2 = [e5];
        let m3 = [e1, e2, e3, e4, e6].sort();
        let m4 = [e3, e4].sort();
        let m5 = [e1, e6].sort();
        let m6 = [e1, e2, e6].sort();
        let m7 = [e3, e4].sort();

        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);

        admin.RemoveComponents(e4, SimpleComptD, SimpleComptE);
        m1 = [e1, e3, e4, e6].sort();
        m2 = [e5];
        m3 = [e1, e2, e3, e4, e6].sort();
        m4 = [e3].sort();
        m5 = [e1, e4, e6].sort();
        m6 = [e1, e2, e4, e6].sort();
        m7 = [e3].sort();
        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);

        admin.AssignComponents(e4, new SimpleComptD(), new SimpleComptE());
        m1 = [e1, e3, e4, e6].sort();
        m2 = [e5];
        m3 = [e1, e2, e3, e4, e6].sort();
        m4 = [e3, e4].sort();
        m5 = [e1, e6].sort();
        m6 = [e1, e2, e6].sort();
        m7 = [e3, e4].sort();
        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);

        admin.RemoveComponents(e3, SimpleComptD);
        m1 = [e1, e3, e4, e6].sort();
        m2 = [e5];
        m3 = [e1, e2, e3, e4, e6].sort();
        m4 = [e4].sort();
        m5 = [e1, e3, e6].sort();
        m6 = [e1, e2, e3, e6].sort();
        m7 = [e4].sort();
        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);

        admin.AssignComponents(e5, new SimpleComptA());
        m1 = [e1, e3, e4, e6].sort();
        m2 = [];
        m3 = [e1, e2, e5, e3, e4, e6].sort();
        m4 = [e4].sort();
        m5 = [e1, e3, e6].sort();
        m6 = [e1, e2, e3, e6].sort();
        m7 = [e4].sort();
        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);

        expect(has_compts(e1, SimpleComptA, SimpleComptB, SimpleComptC)).toBeTruthy();
        expect(has_not_compts(e1, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG)).toBeTruthy();
        expect(has_compts(e2, SimpleComptA)).toBeTruthy();
        expect(has_not_compts(e2, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG)).toBeTruthy();
        expect(has_compts(e3, SimpleComptA, SimpleComptB, SimpleComptC)).toBeTruthy();
        expect(has_not_compts(e3, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG)).toBeTruthy();
        expect(has_compts(e4, SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE)).toBeTruthy();
        expect(has_not_compts(e4, SimpleComptF, SimpleComptG)).toBeTruthy();
        expect(has_compts(e5, SimpleComptA, SimpleComptD, SimpleComptE)).toBeTruthy();
        expect(has_not_compts(e5, SimpleComptB, SimpleComptC, SimpleComptF, SimpleComptG)).toBeTruthy();
        expect(has_compts(e6, SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptG)).toBeTruthy();
        expect(has_not_compts(e6, SimpleComptD, SimpleComptE, SimpleComptF)).toBeTruthy();
    });
    it("fix coverage", () => {
        const new_match: IFilter = { all_of: [SimpleComptA, SimpleComptB] };
        for (const x of admin.GetIndexsByFilter(new_match)) {
            throw (new Error());
        }
        admin.ClearAllEntity();
        admin.AddWatchings(Match_1, Match_1);
    });
});
