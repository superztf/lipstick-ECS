import { EntityAdmin } from "../src/EntityAdmin";
import { SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG } from "./components";
import { Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7 } from "./filters";
import { FilterMatch } from "../src/_filter";
import { IFilter } from "../src/utils";
function RandomInt(min = 5, max = 50) {
    return Math.round(Math.random() * (max - min) + min);
}

function RunTimes(n: number, f: Function) {
    for (let i = 0; i < n; ++i) {
        f();
    }
}

const admin = new EntityAdmin();
admin.AddWatchings(Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7);

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
    it("FilterMatch", () => {
        const e = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
        expect(FilterMatch(admin, Match_1, e)).toBeTruthy();
        expect(FilterMatch(admin, Match_2, e)).toBeFalsy();
        expect(FilterMatch(admin, Match_3, e)).toBeTruthy();
        expect(FilterMatch(admin, Match_4, e)).toBeTruthy();
        expect(FilterMatch(admin, Match_5, e)).toBeFalsy();
        expect(FilterMatch(admin, Match_6, e)).toBeFalsy();
        expect(FilterMatch(admin, Match_7, e)).toBeTruthy();
        admin.ClearAllEntity();
    });
    it("GetIndexsByFilter", () => {
        function get_ents(f: IFilter) {
            const list = [];
            for (const ent of admin.GetIndexsByFilter(f)) {
                list.push(ent);
            }
            list.sort();
            return list;
        }
        const e1 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC());
        const e2 = admin.CreateEntity(new SimpleComptA());
        const e3 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD());
        const e4 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptD(), new SimpleComptE());
        const e5 = admin.CreateEntity(new SimpleComptD(), new SimpleComptE());
        const e6 = admin.CreateEntity(new SimpleComptA(), new SimpleComptB(), new SimpleComptC(), new SimpleComptG());

        const m1 = [e1, e3, e4, e6].sort();
        const m2 = [e5];
        const m3 = [e1, e2, e3, e4, e6].sort();
        const m4 = [e3, e4].sort();
        const m5 = [e1, e6].sort();
        const m6 = [e1, e2, e6].sort();
        const m7 = [e3, e4].sort();
        //  expect(admin.MatchCountByFilter(Match_1)).toBe(4);

        expect(get_ents(Match_1)).toEqual(m1);
        expect(get_ents(Match_2)).toEqual(m2);
        expect(get_ents(Match_3)).toEqual(m3);
        expect(get_ents(Match_4)).toEqual(m4);
        expect(get_ents(Match_5)).toEqual(m5);
        expect(get_ents(Match_6)).toEqual(m6);
        expect(get_ents(Match_7)).toEqual(m7);
    });
});
