import { Component } from "./component";
import { EntityAdmin } from "./EntityAdmin";


abstract class System {
    protected admin: EntityAdmin;

    constructor(a: EntityAdmin) {
        this.admin = a;
    }

    public abstract Update(timeStep: number): void;
}