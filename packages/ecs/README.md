<p align="center">
	<img src="./logo.png">
</p>

# @dark-star/ecs

A multithreaded TypeScript [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system) framework for NodeJS and browsers.

-   Simple and intuitive
-	Rendering framework agnostic
-   Built-in [dependency injection container](https://en.wikipedia.org/wiki/Dependency_injection)
-   Multithreaded with build-in mechanisms to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition)

## Install

```sh
npm i @dark-star/ecs @dark-star/di @dark-star/shared-object
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

Documented examples can be found [here](https://github.com/Ana73l/dark-star/tree/master/examples)

## Docs

API documentation can be found [here](https://ana73l.github.io/dark-star/modules/_dark_star_ecs)
