import { IFilter } from "../src/utils";
import { SimpleComptA, SimpleComptB, SimpleComptC, SimpleComptD, SimpleComptE, SimpleComptF, SimpleComptG } from "./components";
import { Filter } from "../src/filter";
// tslint:disable

export class Match_1 extends Filter {
    protected static readonly _all_of = [SimpleComptA, SimpleComptB, SimpleComptC];
}

export class Match_2 extends Filter {
    protected static readonly _none_of = [SimpleComptA, SimpleComptB, SimpleComptC];
}

export class Match_3 extends Filter {
    protected static readonly _any_of = [SimpleComptA, SimpleComptB, SimpleComptC];
}

export class Match_4 extends Filter {
    static _all_of = [SimpleComptA, SimpleComptB, SimpleComptC];
    static _any_of = [SimpleComptD, SimpleComptE];
}

export class Match_5 extends Filter {
    static _all_of = [SimpleComptA, SimpleComptB, SimpleComptC];
    static _none_of = [SimpleComptD, SimpleComptE];
}

export class Match_6 extends Filter {
    static _any_of = [SimpleComptA, SimpleComptB, SimpleComptC];
    static _none_of = [SimpleComptD, SimpleComptE];
}

export class Match_7 extends Filter {
    static _all_of = [SimpleComptA, SimpleComptB, SimpleComptC];
    static _any_of = [SimpleComptD, SimpleComptE];
    static _none_of = [SimpleComptF, SimpleComptG];
}