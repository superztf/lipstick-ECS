import { IFilter, CLASS } from "./utils";
import { EntityAdmin, Entity } from "./EntityAdmin";
import { Component } from "./component";

export interface IFilterID {
    all_id: number;
    none_id: number;
    any_id: number;
}

export function* FilterComponents(filter: IFilter): IterableIterator<CLASS<Component>> {
    if (filter.all_of) {
        for (const c of filter.all_of) {
            yield c;
        }
    }
    if (filter.any_of) {
        for (const c of filter.any_of) {
            yield c;
        }
    }
    if (filter.none_of) {
        for (const c of filter.none_of) {
            yield c;
        }
    }
}
