# @dark-star/worker-pool

A [worker pool](https://en.wikipedia.org/wiki/Thread_pool) for NodeJS and browsers.

-   Fast communication between threads
-   Supports fixed tasks as well as definition of worker global scope classes and functions
-   Async handling of worker responses
-   Does not require worker.js file

## Install

```sh
npm i @dark-star/worker-pool
```

## API

### Example

```ts
import { WorkerPool } from '@dark-star/worker-pool';

const pool = new WorkerPool({ threads: 4 });

function inefficientFibonacci(input: number): number {
	return input < 2
		? input
		: inefficientFibonacci(input - 2) + inefficientFibonacci(input - 1);
}

const fibonacci = pool.createTask(inefficientFibonacci);

fibonacci.run(10).then(result => {
    // handle the result
    ...
});
```

### Custom worker scope

```ts
import { WorkerPool } from '@dark-star/worker-pool';

class MathUtils {
	static add(a: number, b: number): number {
		return a + b;
	}

	static mul(a: number, b: number): number {
		return a * b;
	}
}

function subtract(a: number, b: number): number {
    return a - b;
}

const workerScript = `
    ${MathUtils.toString()}

    ${subtract.toString()}
`;

const pool = new WorkerPool({ threads: 4, workerScript });
const add = pool.createTask((a: number, b: number) => MathUtils.add(a, b));
const mul = pool.createTask((b: number, b: number) => MathUtils.mul(a, b));
const sub = pool.createTask((a: number, b: number) => subtract(a, b));

Promise
    .all([
        add(1034, 134),
        add(314, 635),
        mul(34, 50),
        sub(1000, 4523)
    ])
    .then(results => {
        // handle results from worker
        ...
    })
```

## Docs

API documentation can be found [here](https://ana73l.github.io/dark-star/modules/_dark_star_worker_pool)
