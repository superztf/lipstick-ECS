import { present } from "../src/utils";
import { EntityAdmin } from "../src/EntityAdmin";
import { SimpleComptA, SimpleComptC, SimpleComptB, SimpleComptD, SimpleComptE, SimpleComptG, SimpleComptF } from "./components";
import { Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7 } from "./filters";
const logger = console;
const NUM = 10000;

describe("performance test", () => {
    const output: string[] = [];
    const admin = new EntityAdmin();
    admin.AddWatchings(Match_1, Match_2, Match_3, Match_4, Match_5, Match_6, Match_7);
    it("run one frame", () => {
        const st = present();
        //
        for (let i = 0; i < NUM; ++i) {
            admin.CreateEntity();
        }
        const mark1 = present();
        output.push(`Create entities\t\t\t${(mark1 - st).toFixed(3)}ms\n`);

        //
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
        const mark2 = present();
        output.push(`Assign components\t\t\t${(mark2 - mark1).toFixed(3)}ms\n`);

        for (let i = 0; i < 100; ++i) {
            for (const e of admin.GetIndexsByFilter(Match_5)) { // Match_5
                const compt_a = admin.GetComponentByIndex(e, SimpleComptA);
                const compt_b = admin.GetComponentByIndex(e, SimpleComptB);
                const compt_c = admin.GetComponentByIndex(e, SimpleComptC);
            }
        }
        const mark3 = present();
        output.push(`Iterating&fetch components\t${(mark3 - mark2).toFixed(3)}ms\n`);

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
        const mark4 = present();
        output.push(`Remove components\t\t\t${(mark4 - mark3).toFixed(3)}ms\n`);

        for (let i = 1; i < NUM + 1; ++i) {
            admin.DeleteEntity(i);
        }
        const ed = present();
        output.push(`Delete entities\t\t\t${(ed - mark4).toFixed(3)}ms\n`);

        output.push(`Total use time\t\t\t${(ed - st).toFixed(3)}ms\n`);
        logger.log("".concat(...output));
    });
});
