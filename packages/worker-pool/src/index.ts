import Worker from 'web-worker';
import { Disposable, assert, IS_NODE } from '@dark-star/core';

import { WORKER_SCRIPT, main as workerMainFunction } from './worker-script';

export const main = workerMainFunction;

/** Configuration object used to create a new WorkerPool */
export type WorkerPoolConfig = {
	/** Number of worker threads to be spawned by the pool */
	threads: number;
	/**
	 * Optional worker global scope definitions
	 *
	 * @remarks
	 * Use this property to set up initial worker global scope.
	 * Functions and classes defined in this string will be available to be called from tasks.
	 *
	 * @example
	 * ```ts
	 * const workerScript = `
	 * const add = (a, b) => a + b;
	 * const mul = (a, b) => a * b;
	 * `;
	 *
	 * const config: WorkerPoolConfig = {
	 *	threads: 4,
	 *	workerScript
	 * };
	 * ```
	 */
	workerScript?: string;
	/**
	 * Optional worker factory.
	 *
	 * @remarks
	 * Use this property instead of workerScript when custom worker needs to be initialized (from a file etc.)
	 * Worker 'message' event listener will be overriden by the worker pool in order to handle worker responses.
	 * If this property is set workerScript is ignored.
	 *
	 * @example
	 * ```ts
	 * const config: WorkerPoolConfig = {
	 * 	threads: 4,
	 * 	workerFactory: () => new Worker(new URL('./worker.js', import.meta.url))
	 * }
	 * ```
	 */
	workerFactory?: () => Worker;
};

/**
 * @callback executable
 * @param {any} data - Input object
 * @returns The result of the callback being called on the input object
 */

/**
 * A runnable task
 *
 * @typeParam TData - Type of input object that will be passed to a worker thread
 * @typeParam TResult - Type of returned object from the worker thread
 */
export type TaskRunner<TData, TResult> = {
	/**
	 * Run an instance of the task parallel to other tasks
	 * @example
	 * ```ts
	 * // tasks will be executed in parallel on different threads
	 * const results = await Promise.all([runFibonacci(3), [runFibonacci(9), [runFibonacci(6)]);
	 * ```
	 * @param {TData} data - The input object for the callback function
	 * @returns {TResult} - The result of the callback function
	 *
	 *
	 */
	run(data: TData): Promise<TResult>;
};

/**
 * @hidden
 * Task response from a worker thread
 */
type WorkerTaskResponse = {
	id: number;
	result?: any;
	error?: any;
};

/**
 * @constant
 * Number of CPU cores
 */
export const CORES_COUNT: number = IS_NODE ? require('os').cpus().length : navigator.hardwareConcurrency;

/**
 * A worker pool used to create tasks, executable on multiple threads
 */
export class WorkerPool implements Disposable {
	private workers: Worker[] = [];
	private idle: number[] = [];
	private resolvers: Map<number, (data: any) => void> = new Map();
	private backlog: { id: number; task: (data: any) => void; params: any }[] = [];
	private taskIdCounter: number = 0;
	private disposePromise?: Promise<void>;
	private _isDisposed: boolean = false;

	/**
	 * Used to create a new WorkerPool
	 * Supports definition of custom worker global scope
	 *
	 * @param {WorkerPoolConfig} config - Configuration for the newly created WorkerPool
	 * @throws if {@link WorkerPoolConfig.threads} is less than 1
	 *
	 * @example
	 * ```ts
	 * // without worker global scope
	 * const pool = new WorkerPool({ threads: CORES_COUNT - 1 });
	 *
	 * // with worker global scope
	 * const workerScript = `
	 * const add = (a, b) => a + b;
	 * const mul = (a, b) => a * b;
	 * `;
	 *
	 * const pool = new WorkerPool({ threads: CORES_COUNT - 1, workerScript });
	 *
	 * // with worker factory
	 * const pool = new WorkerPool({ 
	 * 	threads: CORES_COUNT - 1, 
	 * 	workerFactory: () => new Worker(new URL('./worker.js', import.meta.url))
	 * });
	 * ```
	 */
	constructor({ threads, workerScript = '', workerFactory }: WorkerPoolConfig) {
		assert(threads > 0, `Cannot construct ${this.constructor.name}: number of workers cannot be less than one (passed ${threads})`);

		const workerDef: string | Function = typeof workerFactory === 'function'
			? workerFactory
			: IS_NODE
			? `data:text/javascript,${workerScript} ${WORKER_SCRIPT}`
					.replace(/\s{2,}/g, '')
					.split('\n')
					.join('')
			: URL.createObjectURL(
					new Blob([`${workerScript} ${WORKER_SCRIPT}`], {
						type: 'application/javascript',
					})
			  );

		for (let workerId = 0; workerId < threads; workerId++) {
			this.spawnWorker(workerId, workerDef);
		}
	}

	/**
	 * Creates a new WorkerPool. See {@link WorkerPool}
	 *
	 * @param {WorkerPoolConfig} config
	 * @returns {WorkerPool}
	 *
	 * @example
	 * ```ts
	 * const workerPool = WorkerPool.create({ threads: 4 });
	 * ```
	 */
	public static create(config: WorkerPoolConfig): WorkerPool {
		return new WorkerPool(config);
	}

	/**
	 * @readonly
	 * Number of workers spawned by the pool
	 */
	public get workersCount(): number {
		return this.workers.length;
	}

	/**
	 * @readonly
	 * Indicates whether current WorkerPool instance has been disposed
	 */
	public get isDisposed(): boolean {
		return this._isDisposed;
	}

	/**
	 * Create a task factory.
	 * Tasks scheduled from a single factory are unique independent instance and thus can be scheduled multiple times.
	 *
	 * @typeParam TData - Type of object the executable callback accepts
	 * @typeParam TResult - Type of object the executable callback returns
	 *
	 * @param {executable} executable - The function that will be called on a worker thread
	 * @returns {TaskRunner<TData, TResult>} - Task factory that will be used to schedule tasks using a common callback
	 *
	 * @example
	 * ```ts
	 * // recursive inefficient implementation
	 * function fibonacci(input: number): number {
	 * 	return input < 2 ? input : fibonacci(input - 2) + fibonacci(input - 1);
	 * }
	 *
	 * const pool = new WorkerPool({ threads: 3 });
	 * const runFibonacci = workerPool.createTask(fibonacci);
	 * `;
	 * ```
	 */
	public createTask = <TData, TResult>(executable: (data: TData) => TResult): TaskRunner<TData, TResult> => {
		return {
			run: (data: TData): Promise<TResult> => {
				const taskId = this.taskIdCounter++;

				this.backlog.push({
					id: taskId,
					task: executable,
					params: data,
				});

				const resolver = new Promise<TResult>((result) => this.resolvers.set(taskId, result));

				this.runNext();

				return resolver;
			},
		};
	};

	/**
	 * Terminate the worker threads spawned by the pool and clear its structures
	 * @throws Will throw an error if WorkerPool instance has already been disposed of
	 * @returns {Promise<void>}
	 *
	 * @example
	 * ```ts
	 * const pool = WorkerPool.create({ threads: 4});
	 *
	 * const shutdown = async () => {
	 * 	await pool.dispose();
	 * }
	 * ```
	 */
	public async dispose(): Promise<void> {
		assert(!this._isDisposed, 'Cannot dispose of an already disposed WorkerPool');

		if (this.disposePromise) {
			return this.disposePromise;
		}

		// @babel SyntaxError: Cannot convert non-arrow function to a function expression.
		const self = this;
		const dispose = async function (resolve: (value: void | PromiseLike<void>) => void) {
			for (const worker of self.workers) {
				await worker.terminate();
			}

			while (self.workers.length) {
				self.workers.pop();
			}

			self.resolvers.clear();

			while (self.idle.length) {
				self.idle.pop();
			}

			while (self.backlog.length) {
				self.backlog.pop();
			}

			self.taskIdCounter = 0;
			self._isDisposed = true;

			resolve();
		};

		this.disposePromise = new Promise<void>(dispose);

		return this.disposePromise;
	}

	private spawnWorker(workerId: number, workerDef: string | Function) {
		const worker = typeof workerDef === 'function' ? workerDef() : new Worker(workerDef);

		worker.addEventListener('message', (e: any) => {
			this.handleWorkerResponse(e, workerId);
		});

		this.workers.push(worker);
		this.idle.push(workerId);
	}

	private handleWorkerResponse(e: any, workerId: number) {
		const { id, result, error } = e.data as WorkerTaskResponse;

		assert(error === undefined, `Error in worker script: ${error}`);

		this.resolvers.get(id)!(result);
		this.resolvers.delete(id);
		this.idle.push(workerId);
		this.runNext();
	}

	private runNext() {
		if (this.backlog.length === 0 || this.idle.length === 0) {
			return;
		}

		const task = this.backlog.shift()!;
		const workerId = this.idle.shift()!;

		const payload = { ...task, task: task.task.toString() };
		this.workers[workerId]!.postMessage(payload);

		this.runNext();
	}
}
