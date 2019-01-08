

[![Build Status](https://travis-ci.org/superztf/lipstick-ECS.svg?branch=master)](https://travis-ci.org/superztf/lipstick-ECS)
[![NpmVersion](https://img.shields.io/npm/v/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![NpmDownload](https://img.shields.io/npm/dt/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![NpmLicense](https://img.shields.io/npm/l/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![Coverage Status](https://coveralls.io/repos/github/superztf/lipstick-ECS/badge.svg?branch=master)](https://coveralls.io/github/superztf/lipstick-ECS?branch=master)
[![maintainability](https://img.shields.io/codeclimate/maintainability-percentage/superztf/lipstick-ECS.svg)](https://codeclimate.com/github/superztf/lipstick-ECS)

# lipstick-ECS

```bash
$ npm install lipstick-ecs --save
```
## Introduction
lipstick-ECS is a tiny ECS framework for js or ts especially. It is easy to use because of good generic constraints implemented by full use of [Generics of Typescript](http://www.typescriptlang.org/docs/handbook/generics.html).

I try to make it support iteration of complex component combinations and keep it performant as possible. 
But there are still some unsatisfactory currently:
> * If the number of entities exceeds 100k, it is better not to choose lipstick-ecs at present.
> * The most consumptive operation is assigning a being [watched](https://superztf.github.io/lipstick-ECS/classes/entityadmin.html#addwatchings) component.
> * Assigning 22k being watched components takes 70ms.(10ms to create 22k component object)
> * Test in CPU: 3.40GHz Node: v10.11.0

## Getting Started
* [ECS Concept](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system)
* [Documentation](https://superztf.github.io/lipstick-ECS/globals.html)
* [See a real example](https://github.com/superztf/ECS-example)

## Example Code
```typescript
import { EntityAdmin, System, Component, IFilter } from "lipstick-ecs";

class Position extends Component {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }
}

class Velocity extends Component {
    public vx: number = 0;
    public vy: number = 0;
}

class Color extends Component { }
class Shape extends Component { }
class PlayerID extends Component { }
class PlayerName extends Component { }
class HiddenDisplay extends Component { }

const Match: IFilter = {
    all_of: [Position, Color, Shape],
    any_of: [PlayerID, PlayerName],
    none_of: [HiddenDisplay],
};

class MovementSystem extends System {
    public static Update(admin: EntityAdmin, deltatime: number): void {
        for (const pos of admin.GetComponentsByTuple(Position, Velocity)) {
            const vel: Velocity = pos.SureSibling(Velocity);
            pos.x += vel.vx * deltatime;
            pos.y += vel.vy * deltatime;
        }
    }
}

class RendererSystem extends System {
    public static Update(admin: EntityAdmin, deltatime: number): void {
        for (const ent of admin.GetEnttsByFilter(Match)) {
            const pos: Position = admin.SureComponentByEntity(ent, Position);
            const color: Color = admin.SureComponentByEntity(ent, Color);
            const shape: Shape = pos.SureSibling(Shape);
            if (admin.HasComponent(ent, HiddenDisplay)) {
                console.log("won't print this message...");
            } else {
                console.log("yes, the entity has not HiddenDisplay components.");
            }
            // do something for RendererSystem ...
            if (pos.x > 6) {
                // ...
            }
        }
    }
}

const admin = new EntityAdmin();
admin.AddWatchings(Match);
admin.start();

admin.CreateEntity(new Position(22, 33), new Color(), new Shape(), new PlayerID());
admin.CreateEntity(new PlayerID());
const ent = admin.CreateEntity();
admin.AssignComponents(ent, new Shape(), new Color());
admin.DeleteEntity(ent);

setInterval(() => { admin.UpdateSystems(); }, 200);

```