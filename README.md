

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

>This is a big change from 0.1.4 to ^0.2.0. And documentation for the ^0.2.0 version is not ready yet.

* [Source Code](https://github.com/superztf/lipstick-ECS/tree/watching_components)
* [ECS Concept](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system)
* [Documentation](https://superztf.github.io/lipstick-ECS/globals.html)
* [See a real example](https://github.com/superztf/ECS-example)

# Example Code
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
            const shape: Shape = admin.SureComponentByEntity(ent, Shape);
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