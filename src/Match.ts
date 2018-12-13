import { Component } from "./component";

export interface Match<T extends Component> {
    all_of?: (new () => T)[];
    none_of?: (new () => T)[];
    any_of?: (new () => T)[];
}

export function MatchIdentify(m: Match<any>) {
    let all_of: string = "";
    if (m.all_of) {
        m.all_of.sort();
        all_of = m.all_of.toString();
    }
    let none_of: string = "";
    if (m.none_of) {
        m.none_of.sort();
        none_of = m.none_of.toString();
    }
    let any_of: string = "";
    if (m.any_of) {
        m.any_of.sort();
        any_of = m.any_of.toString();
    }
    return `${all_of}+${none_of}+${any_of}`;
}