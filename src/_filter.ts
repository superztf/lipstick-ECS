import { IFilter, CLASS } from "./utils";
import { Component } from "./component";

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
