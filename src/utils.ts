export type CLASS<T> = new (...args: any) => T;

export function present() {
    const time = process.hrtime();
    return time[0] * 1e3 + time[1] / 1e6;
}
