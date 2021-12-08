# World

## Methods

-   [spawn](#spawn)
-   [destroy](#destroy)
-   [get](#get)
-   [attach](#attach)
-   [detach](#detach)
-   [addSystem](#addSystem)
-   [removeSystem](#removeSystem)
-   [query](#qeury)
-   [step](#step)

## spawn

Spawns a new `Entity` in the world on the next world step

```ts
world.spawn([Position, Velocity], (entity, [position, velocity]) => {
    position.x = 10;
});
```

### Arguments:

-   componentTypes: `Array`, component types to assign to an entity
-   initializer: `Function`, optional, initializer function for the components

## spawnImmediate

Spawns a new `Entity` in the world immediately

```ts
world.spawn([Position, Velocity], (entity, [position, velocity]) => {
    position.x = 10;
});
```

### Arguments:

-   componentTypes: `Array`, component types to assign to an entity
-   initializer: `Function`, optional, initializer function for the components

## destroy

Removes an `Entity` from the world

```ts
world.destroy(entity);
```

### Arguments:

-   entity: `Entity`, the entity to remove

### Returns:

-   components: `Map<ComponentType, InstanceType<ComponentType>>`, a map of each component type and its instance

## get

Retrieves a `Component` instance for an `Entity` by the component's type

```ts
class Position {
    x = 0;
    y = 0;
    z = 0;
}

const position = world.get(entity, Position);
```

### Arguments:

-   entity: `Entity`
-   componentType: `Component` class

## attach

Attaches a `Component` instance to an `Entity`

```ts
world.attach(entity, new Position());
```

### Arguments:

-   entity: `Entity`
-   component: `Component` instance

## detach

Detaches a `Component` instance from an `Entity`

```ts
world.detach(entity, Position);
```

### Arguments:

-   entity: `Entity`
-   component: `Component` instance

## addSystem

Adds a `System` instance for execution

```ts
import { System } from 'dark-star-ecs';

class SampleSystem extends System {}

world.addSystem(new SampleSystem(world));
```

### Arguments:

-   system: `System` instance

## removeSystem

Removes a `System` instance by its type

```ts
world.removeSystem(SampleSystem);
```

### Arguments:

-   systemType: `System` class

## query

Queries the world for all Entities with given set of `Component` classes
