# dark-star-ecs

## Documentation

-   [API Reference]()

## Install

```sh
npm install @dark-star/ecs
```

## Usage

```ts
import { WorldBuilder } from '@dark-star/ecs';

class Vector3 {
    x = 0;
    y = 0;
    z = 0;
}

@component
class Position extends Vector3 {}

@component
class Velocity extends Vector3 {}

const world = await new WorldBuilder().build();

const mobileEntity = world.spawn([Position, Velocity], (entity, [position, velocity]) => {});
```
