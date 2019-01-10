import { ComponentType } from "./utils";

/**
 * Combinations of components. It's a base class for all filters to inherit from.
 *
 * @abstract
 * @class Filter
 */
export class Filter {

    public static all_bit: number = 0;
    public static any_bit: number = 0;
    public static none_bit: number = 0;

    /**
     *
     *
     * @readonly
     * @static
     * @memberof Filter
     */
    public static get all_of() {
        return this._all_of;
    }

    public static get any_of() {
        return this._any_of;
    }

    public static get none_of() {
        return this._none_of;
    }

    /**
     *
     *
     * @static
     * @type {ComponentType[]}
     * @memberof Filter
     */
    protected static readonly _none_of: ComponentType[] = [];

    /**
     *
     *
     * @static
     * @type {ComponentType[]}
     * @memberof Filter
     */
    protected static readonly _any_of: ComponentType[] = [];

    /**
     *
     *
     * @static
     * @type {ComponentType[]}
     * @memberof Filter
     */
    protected static readonly _all_of: ComponentType[] = [];
}

export type FilterType = typeof Filter;
