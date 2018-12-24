import { IFilter } from "./utils";
import * as assert from "assert";
export type FilterID = string;

export function makefilterid(f: IFilter) {

    const all_of = f.all_of ? Array.from(f.all_of).sort().toString() : "";
    const any_of = f.any_of ? Array.from(f.any_of).sort().toString() : "";
    const none_of = f.none_of ? Array.from(f.none_of).sort().toString() : "";
    return `${all_of}:${any_of}:${none_of}`;
}

export class Filter {
    private _id: FilterID;
    private filter: IFilter; // will reference IFilter. so do not change

    constructor(f: IFilter) {
        assert.ok(f.all_of || f.any_of || f.none_of, "IFilter should has attribute of all_of, any_of or none_of");
        this._id = makefilterid(f);
        this.filter = f;
    }

    public get id(): FilterID {
        return this._id;
    }

    public *Components() {
        if (this.filter.all_of) {
            for (const c of this.filter.all_of) {
                yield c;
            }
        }
        if (this.filter.any_of) {
            for (const c of this.filter.any_of) {
                yield c;
            }
        }
        if (this.filter.none_of) {
            for (const c of this.filter.none_of) {
                yield c;
            }
        }
    }

}
