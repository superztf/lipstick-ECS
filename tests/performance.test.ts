import { present } from "../src/utils";
import { EntityAdmin } from "../src/EntityAdmin";
import { SimpleComptA, SimpleComptC, SimpleComptB, SimpleComptD, SimpleComptE, SimpleComptG, SimpleComptF } from "./components";
import { Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7 } from "./filters";
const logger = console;
const NUM = 30000;
/**
 * TEST ENV:
 * node v8.9.3
 * cpu 2.6GHz
 */
describe("performance test", () => {
    const admin = new EntityAdmin();
    admin.AddWatchings(Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7);
    it("run one frame", () => {
        const st = present();
        // create entities
        for (let i = 0; i < NUM; ++i) {
            admin.CreateEntity();
        }
        // assign components
        for (let i = 1; i < NUM * 3 / 10 + 1; ++i) {
            admin.AssignComponents(i, new SimpleComptA());
            admin.AssignComponents(i, new SimpleComptB(), new SimpleComptC());
        }
        for (let i = NUM * 3 / 10; i < NUM * 6 / 10; ++i) {
            admin.AssignComponents(i, new SimpleComptD());
            admin.AssignComponents(i, new SimpleComptE(), new SimpleComptF());
        }
        for (let i = NUM * 6 / 10; i < NUM; ++i) {
            admin.AssignComponents(i, new SimpleComptG());
        }
        // Iterating 100 times over the entities matched by Match_5, and get SimpleComptA,SimpleComptB,SimpleComptC for ench entity
        for (let i = 0; i < 100; ++i) {
            for (const e of admin.GetIndexsByFilter(Match_5)) { // Match_5
                const compt_a = admin.GetComponentByIndex(e, SimpleComptA);
                const compt_b = admin.GetComponentByIndex(e, SimpleComptB);
                const compt_c = admin.GetComponentByIndex(e, SimpleComptC);
            }
        }
        // remove all components
        for (let i = 1; i < NUM * 3 / 10 + 1; ++i) {
            admin.RemoveComponents(i, SimpleComptA);
            admin.RemoveComponents(i, SimpleComptB, SimpleComptC);
        }
        for (let i = NUM * 3 / 10; i < NUM * 6 / 10; ++i) {
            admin.RemoveComponents(i, SimpleComptD);
            admin.RemoveComponents(i, SimpleComptE, SimpleComptF);
        }
        for (let i = NUM * 6 / 10; i < NUM; ++i) {
            admin.RemoveComponents(i, SimpleComptG);
        }
        // delete all entities
        for (let i = 1; i < NUM + 1; ++i) {
            admin.DeleteEntity(i);
        }
        const ed = present();
        const use = (ed - st) / 1000;
        logger.log("use time:", use, "ms");
        // expect cost time less than 1ms in one frame.
        expect(use).toBeLessThan(1);
    });
});
