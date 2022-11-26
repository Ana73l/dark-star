# @dark-star/ecs

A multithreaded TypeScript [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system) framework for NodeJS and browsers.

-   Simple and intuitive
-   Multithreaded
-   Built-in [dependency injection container](https://en.wikipedia.org/wiki/Dependency_injection) 

## Install

```sh
npm i @dark-star/ecs
```

Modify `tsconfig.json` to enable decorators

```json
{
	"compilerOptions": {
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true
	}
}
```

Add a polyfill for the Reflect extensions.

The Reflect polyfill is needed to make dependency injection work. It should be imported once, before ECS is used (preferably start of index.ts)

```ts
// index.ts
import 'reflect-metadata';

// ...
```

## API

### Examples

## Docs

API documentation can be found [here](https://ana73l.github.io/dark-star/modules/_dark_star_ecs)
