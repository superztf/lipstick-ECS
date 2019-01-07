import { Component } from "./component";
import { System } from "./system";

export type ComponentType = typeof Component;
export type SystemType = typeof System;
// tslint:disable-next-line:interface-name
export interface CLASS<T> {
    id: number;
    new(...p: any[]): T;
}

/**
 *
 *
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
