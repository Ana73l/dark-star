import Worker from 'web-worker';
import { Disposable, assert } from '@dark-star/core';

import { WORKER_SCRIPT } from './worker-script';

/** Configuration object used to create a new WorkerPool */
export type WorkerPoolOpts = {
	/** Number of worker threads to be spawned by the pool */
	threads: number;
	/**
	 * Optional worker global scope definitions
	 *
	 * Use this property to set up initial worker global scope.
	 * Functions and classes defined in this string will be available to be called from tasks.
	 * ```ts
	 * const workerScript = `
	 * const add = (a, b) => a + b;
	 * const mul = (a, b) => a * b;
	 *
	 * const workerPoolOpts: WorkerPoolOpts = {
	 *     threads: 4,
	 * 	   workerScript
	 * }
	 * `;
	 * ```
	 */
	workerScript?: string;
};

/**
 * A runnable task
 *
 * @typeParam TData - Type of input object that will be passed to a worker thread
 * @typeParam TResult - Type of returned object from the worker thread
 */
export type Task<TData, TResult> = {
	/**
	 * Run an instance of the task parallel to other tasks
	 *
	 * @param {TData} data - The input object for the callback function
	 * @returns {TResult} - The result of the callback function
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
 * Indicates whether current environment is node
 */

// @ts-ignore
export const isNode: boolean = typeof process === 'object';

/**
 * A worker pool used to create task, schedulable on multiple threads
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
	 */
	constructor({ threads, workerScript = '' }: WorkerPoolOpts) {
		assert(
			threads > 0,
			`Cannot construct ${this.constructor.name}: number of workers cannot be less than one (passed ${threads})`
		);

		const script = isNode
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
			this.spawnWorker(workerId, script);
		}
	}

	/**
	 * Number of workers spawned by the pool
	 */
	public get workersCount(): number {
		return this.workers.length;
	}

	/**
	 * Indicates whether current WorkerPool instance has been disposed
	 */
	public get isDisposed(): boolean {
		return this._isDisposed;
	}

	/**
	 * @callback executable
	 * @param {any} data - Input object
	 * @returns The result of the callback being called on the input object
	 */

	/**
	 * Create a task factory.
	 * Tasks scheduled from a single factory are unique independent instance and thus can be scheduled multiple times.
	 *
	 * @typeParam TData - Type of object the executable callback accepts
	 * @typeParam TResult - Type of object the executable callback returns
	 *
	 * @param {executable} executable - The function that will be called on a worker thread
	 * @returns {Task} - Task factory that will be used to schedule tasks using a common callback
	 */
	public createTask = <TData, TResult>(executable: (data: TData) => TResult): Task<TData, TResult> => {
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
	 *
	 * @returns {Promise<void>}
	 */
	public async dispose(): Promise<void> {
		assert(!this._isDisposed, 'Cannot dispose of already disposed WorkerPool');

		if (this.disposePromise) {
			return this.disposePromise;
		}

		this.disposePromise = new Promise<void>(async (resolve) => {
			for (const worker of this.workers) {
				await worker.terminate();
			}

			while (this.workers.length) {
				this.workers.pop();
			}

			this.resolvers.clear();

			while (this.idle.length) {
				this.idle.pop();
			}

			while (this.backlog.length) {
				this.backlog.pop();
			}

			this.taskIdCounter = 0;
			this._isDisposed = true;

			resolve();
		});

		return this.disposePromise;
	}

	private spawnWorker(workerId: number, url: string) {
		const worker = new Worker(url);

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
