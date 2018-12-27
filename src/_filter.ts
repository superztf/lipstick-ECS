import { IFilter, CLASS } from "./utils";
import { Component } from "./component";
import { throwError } from "./_utils";

export interface IFilterID {
    all_id: number;
    none_id: number;
    any_id: number;
}

export function FilterComponents(filter: IFilter): Array<CLASS<Component>> {
    const list = [];
    if (filter.all_of) {
        for (const c of filter.all_of) {
            list.push(c);
        }
    }
    if (filter.any_of) {
        for (const c of filter.any_of) {
            list.push(c);
        }
    }
    if (filter.none_of) {
        for (const c of filter.none_of) {
            list.push(c);
        }
    }
    return list;
}

export function CheckFilter(f: IFilter) {
    if (!f.all_of && !f.any_of && !f.none_of) {
        throwError("IFilter invalid. It can't be empty");
    }
    const set: Set<CLASS<Component>> = new Set();
    for (const c of FilterComponents(f)) {
        if (set.has(c)) {
            throwError("IFilter invalid. Duplicate components " + c.name);
        }
        set.add(c);
    }
}
