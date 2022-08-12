import Worker from 'web-worker';
import { Disposable, assert } from '@dark-star/core';

import { WORKER_SCRIPT } from './worker-script';

export type WorkerPoolOpts = {
	threads: number;
	workerScript?: string;
};

export type Task<TData, TResult> = {
	run(data: TData): Promise<TResult>;
};

type WorkerTaskResponse = {
	id: number;
	result?: any;
	error?: any;
};

// @ts-ignore
export const isNode = typeof process === 'object';

export class WorkerPool implements Disposable {
	private workers: Worker[] = [];
	private idle: number[] = [];
	private resolvers: Map<number, (data: any) => void> = new Map();
	private backlog: { id: number; task: (data: any) => void; params: any }[] = [];
	private taskIdCounter: number = 0;
	private _isDisposed: boolean = false;

	constructor({ threads, workerScript = '' }: WorkerPoolOpts) {
		assert(
			threads >= 1,
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

	public get workersCount(): number {
		return this.workers.length;
	}

	public get isDisposed(): boolean {
		return this._isDisposed;
	}

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

	public async dispose(): Promise<void> {
		assert(!this._isDisposed, 'Cannot dispose of already disposed WorkerPool');

		await Promise.all(this.workers.map((worker) => worker.terminate));

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
