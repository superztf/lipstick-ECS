import { EntityAdmin, Entity } from "../src/EntityAdmin";
import { Component } from "../src/component";

class Move extends Component {
    speed = 0;
    constructor() {
        super();
    }
}

class Items extends Component {
    bagsize = 0;
    constructor(bb: number) {
        super();
    }

}

const obj = new EntityAdmin();
let ent: Entity = obj.CreateEntity(new Move(), new Items(22));
let mm = obj.GetComponentByEntity(ent, Move)
let yes = obj.GetComponentsByTuple(Items, Move, Items, Move);
for (let oo of obj.GetComponents(Move)) {

}
function test() {

}