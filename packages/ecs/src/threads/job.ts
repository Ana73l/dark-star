export const $dependencies = Symbol('dark_star_job_handle_dependencies');

export type JobId = number;

export interface JobHandle {
	readonly id: JobId;
	readonly isComplete: boolean;

	complete(): Promise<void>;

	[$dependencies]?: Set<number>;
}

export interface Job {
	schedule(): JobHandle;
	run(): Promise<void>;
}

export interface ParallelJob extends Job {
	scheduleParallel(): JobHandle;
}

export const createNullHandle = (): JobHandle => ({
	id: -1,
	isComplete: true,
	complete: async () => {},
});
