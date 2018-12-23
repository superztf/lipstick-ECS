import { Component } from "./component";

export type CLASS<T> = new (...args: any) => T;
export type FilterID = string;

export interface IFilter<T> {
    all_of: [CLASS<T>, ...Array<CLASS<T>>];
    any_of?: Array<CLASS<T>>;
    none_of?: Array<CLASS<T>>;
}

export function makefilterid() {

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
        return performance.now();
    } catch (err) {
        const time = process.hrtime();
        return time[0] * 1e3 + time[1] / 1e6;
    }
}

export function throwError(errmsg: string) {
    throw (new Error(`ECS-ERROR: ${errmsg}`));
}
