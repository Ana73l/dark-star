import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';

import { WorldBuilder, component, System, system, World, QueryResult } from '../src/index';

@component
class Position {
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

@component
class Velocity {
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

@system
class MS extends System {
    private mobile: QueryResult<[typeof Position, typeof Velocity]>;

    constructor(world: World) {
        super();

        this.mobile = world.query([Position, Velocity]);
    }

    execute(deltaT: number) {
        this.mobile.each((entity, [position, velocity]) => {
            position.x += velocity.x * deltaT;
            position.y += velocity.y * deltaT;
            position.z += velocity.z * deltaT;

            console.log(entity, position);
        });
    }
}

@system
class VS extends System {
    private entities: QueryResult<[typeof Velocity]>;
    constructor(world: World) {
        super();

        this.entities = world.query([Velocity]);
    }
    execute() {
        this.entities.each((entity, [velocity]) => {
            velocity.x += 0.001;
            velocity.y -= 0.001;
            velocity.z += 0.0001;
        });
    }
}

describe('play', () => {
    describe('WorldBuilder', () => {
        it('', async () => {
            const world = await new WorldBuilder().registerSystem(VS).registerSystem(MS).build();

            world.spawn([Position, Velocity], (entity, [position, velocity]) => {
                position.x = 10;
                position.y = -50;
                position.z = 100;
            });

            world.spawn([Position, Velocity], (entity, [position, velocity]) => {
                position.x = 10;
                position.y = -50;
                position.z = 100;
            });

            for (let i = 0; i < 10; i++) {
                world.step(0.05);
            }
        });
    });
});
