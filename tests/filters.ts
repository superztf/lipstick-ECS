import { IFilter } from "../src/utils";
import { SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG } from "./components";

export const Match_1: IFilter = {
    all_of: [SimpleComptA, SimpleComptB, SimpleComptC],
};

export const Match_2: IFilter = {
    none_of: [SimpleComptA, SimpleComptB, SimpleComptC],
};

export const Match_3: IFilter = {
    any_of: [SimpleComptA, SimpleComptB, SimpleComptC],
};

export const Match_4: IFilter = {
    all_of: [SimpleComptA, SimpleComptB, SimpleComptC],
    any_of: [SimpleComptD, SimpleComptE],
};

export const Match_5: IFilter = {
    all_of: [SimpleComptA, SimpleComptB, SimpleComptC],
    none_of: [SimpleComptD, SimpleComptE],
};

export const Match_6: IFilter = {
    any_of: [SimpleComptA, SimpleComptB, SimpleComptC],
    none_of: [SimpleComptD, SimpleComptE],
};

export const Match_7: IFilter = {
    all_of: [SimpleComptA, SimpleComptB, SimpleComptC],
    any_of: [SimpleComptD, SimpleComptE],
    none_of: [SimpleComptF, SimpleComptG],
};
