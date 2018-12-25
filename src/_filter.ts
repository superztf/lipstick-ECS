import { IFilter, CLASS } from "./utils";
import { EntityAdmin, Entity } from "./EntityAdmin";
import { Component } from "./component";

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

export function FilterMatch(admin: EntityAdmin, fobj: IFilter, e: Entity): boolean {
    if (fobj.none_of) {
        for (const c of fobj.none_of) {
            if (admin.GetComponentByEntity(e, c)) {
                return false;
            }
        }
    }

    if (fobj.all_of) {
        for (const c of fobj.all_of) {
            if (!admin.GetComponentByEntity(e, c)) {
                return false;
            }
        }
    }

    if (fobj.any_of) {
        let find = false;
        for (const c of fobj.any_of) {
            if (admin.GetComponentByEntity(e, c)) {
                find = true;
                break;
            }
        }
        if (!find) {
            return false;
        }
    }

    return true;
}
