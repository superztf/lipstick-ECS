import { Component } from "./component";
import { System } from "./system";

export type ComponentType = typeof Component;
export type SystemType = typeof System;

/**
 * Component class type.
 *
 * @export
 * @interface CLASS
 * @template T
 */
// tslint:disable-next-line:interface-name
export interface CLASS<T> {
    id: number;
    new(...p: any[]): T;
}

/**
 * Combinations of components.
 *
 * Attention: EntityAdmin.AddWatchings() use IFilter object's reference to identify.
 *
 * ```typescript
 * // **************************************************************************************
 * // The codes below cannot get expected results.(f1 and f2 is not from the same reference)
 * // **************************************************************************************
 * // module_a.ts
 * const f1: IFilter = {
 *  all_of: [ComponentA, ComponentB],
 *   none_of: [ComponentC],
 * };
 * admin.AddWatchings(f1);
 *
 * // module_b.ts
 * const f2: IFilter = {
 *  all_of: [ComponentA, ComponentB],
 *  none_of: [ComponentC],
 * };
 * for(const ent of admin.GetEnttsByFilter(f2)) { }
 *
 * // **************************************
 * // You can do this in the following ways.
 * // **************************************
 * // module_c.ts
 * export const Match_1: IFilter = {
 *  all_of: all_of: [ComponentA, ComponentB],
 *  none_of: [ComponentC],
 * };
 *
 * // module_a.ts
 * import { Match_1 } from "./module_c";
 * admin.AddWatchings(Match_1);
 *
 * // module_b.ts
 * import { Match_1 } from "./module_c";
 * for(const ent of admin.GetEnttsByFilter(Match_1)) { }
 * ```
 * @export
 * @interface IFilter
 */
export interface IFilter {
    all_of?: [ComponentType, ...ComponentType[]];
    any_of?: [ComponentType, ...ComponentType[]];
    none_of?: [ComponentType, ...ComponentType[]];
}

/**
 * This function returns a millisecond time.
 * The return is relative to an arbitrary time in the past, and not related to a date time or time stamp. Therefore not subject to clock drift. The primary use is for measuring the elapsed time.
 * If lipstick-ECS runs in browser, present() calls performance.now() actually. If in node, present() calls process.hrtime().
 *
 * @export
 * @returns
 */
export function present() {
    try {
        const time = process.hrtime();
        return time[0] * 1e3 + time[1] / 1e6;
    } catch (err) {
        return performance.now();
    }
}
