# @dark-star/di

A [dependency injection container](https://en.wikipedia.org/wiki/Dependency_injection) for NodeJS and browsers.

Supports:

-   Constructor based injections
-   Defining abstract classes as interfaces (and identifiers for injection)
-   Injection of singleton and transient providers

## Install

```sh
npm i @dark-star/di
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

The Reflect polyfill should be imported once, before DI is used (preferably start of index.ts)

```ts
// index.ts
import 'reflect-metadata';

// ...
```

## API

### Example

```ts
import { ContainerBuilder, injectable } from '@dark-star/di';

@injectable()
class Logger {
	// ...
}

@injectable()
class Database {
	constructor(public logger: Logger) {}
}

@injectable()
class UserService {
	constructor(public database: Database, public logger: Logger) {}
	// ...
}

const container = new ContainerBuilder()
	.registerTransient(Logger)
	.registerSingleton(Database)
	.registerSingleton(UserService)
	.build();

// order of retrieval from container does not matter
const userService = container.get(UserService);
const database = container.get(Database);

console.log(userService.database === database); // true - Database is registered as singleton
console.log(userService.logger === database.logger); // false - Logger is registered as transient
```

### Using abstract classes as interface/ injectable identifiers

```ts
import { ContainerBuilder, injectable } from '@dark-star/di';

abstract class ILogger {
    abstract log(...inputs: []): void;
    // ...
}

@injectable()
class UserService {
    constructor(private logger: ILogger) {}
    // ...
}

const logger: ILogger = {
    log: (...inputs[]) => {
        // ...
    }
};

// instances can only be added as singleton providers
const container = new ContainerBuilder()
	.registerSingleton(UserService)
    .registerSingleton(ILogger, logger)
	.build();
```

## Docs

API documentation can be found [here](https://ana73l.github.io/dark-star/modules/_dark_star_di)
