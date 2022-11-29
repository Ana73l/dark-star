import { ComponentTypeId } from '../../component';

export const $dependencies = Symbol('dark_star_job_handle_dependencies');
export const $readers = Symbol('dark_star_job_readers');
export const $writers = Symbol('dark_star_job_writers');

/** 
 * Utility type representing a unique {@link Job job} identifier.
 * 
 * @see
 * {@link Job}\
 * {@link JobHandle}
 */
export type JobId = number;

/**
 * Mechanism for completion of {@link Job jobs}.
 * 
 * @remarks
 * When the {@link Job.schedule} method is called a JobHandle is returned.
 * The JobHandle can then be used as a dependency for other {@link Job jobs} and ensuring their completion.
 * 
 * @see
 * {@link Job}\
 * {@link ParallelJob}
 */
export interface JobHandle {
	/**
	 * Unique {@link Job job} identifier. 
	 * 
	 * @remarks
	 * Used internally to keep track of dependencies in order to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	readonly id: JobId;
	/**
	 * True if {@link Job job} is completed. False if {@link Job job} is scheduled/ running.
	 */
	readonly isComplete: boolean;
	/**
	 * Ensures the {@link Job job} and its dependencies are completed.
	 * 
	 * @remarks
	 * {@link Job Jobs} do not start executing when {@link Job.schedule scheduled}.
	 * 
	 * In order to wait for completion of the {@link Job job} and safely access the data it modifies, this method needs to be awaited.
	 * 
	 * If a {@link Job job} is dependent on another, [awaiting](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) the first {@link Job job's} complete method ensures the second job is also complete.
	 * 
	 * @see
	 * {@link Job.schedule}\
	 * {@link ParallelJob.scheduleParallel}
	 * 
	 * @example
	 * ```ts
	 * const jobHandleA: JobHandle = // jobA defintion ...
	 * 	.schedule(); // scheduling jobA does not start the execution process
	 * 
	 * const jobHandleB: JobHandle = // jobB definition ...
	 * 	.schedule(jobHandleA) // schedule jobB with a dependency on jobA
	 * 
	 * await jobHandleB.complete(); // await completion of jobB
	 * console.log(jobHandleB.isComplete); // true
	 * console.log(jobHandleA.isComplete); // true
	 * ``` 
	 */
	complete(): Promise<void>;
	/**
	 * @internal
	 * List of unique {@link Job job} identifiers on which the scheduled {@link Job job} depends.
	 */
	[$dependencies]?: Set<JobId>;
	/**
	 * @internal
	 * List of {@link component component type} identifiers to which the scheduled {@link Job job} has read access.
	 * 
	 * @remarks
	 * Used internally to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$readers]?: ComponentTypeId[];
	/**
	 * @internal
	 * List of {@link component component type} identifiers to which the scheduled {@link Job job} has write access.
	 * 
	 * @remarks
	 * Used internally to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition).
	 */
	[$writers]?: ComponentTypeId[];
}

/**
 * Jobs represent work that can be scheduled to run in parallel to other jobs on an available background thread.
 * 
 * @remarks
 * Jobs allow writing simple and safe multithreaded code in {@link WorldBuilder.useThreads multithreaded} {@link World worlds}.
 * 
 * Scheduling a job returns a {@link JobHandle} which can be used to ensure job completion, as well as defining dependencies between jobs.
 * 
 * Jobs cannot be {@link Job.schedule scheduled} or {@link JobHandle.complete completed} from within jobs.
 */
export interface Job {
	/**
	 * Schedules the job for execution on a single background thread, parallel to the main thread and other jobs.
	 * 
	 * @remarks
	 * Once a job has been scheduled, it cannot be cancelled. The returned {@link JobHandle} allows job completion, as well as allowing current job to be used as dependency for other jobs.
	 * 
	 * Jobs that run on background threads do NOT have access to main thread APIs. Jobs that require access to main thread APIs should be {@link Job.run ran} rather than scheduled.
	 * 
	 * If schedule is called in a singlethreaded {@link World world}, the method will perform the work on the main thread and return a completed {@link JobHandle}.
	 * 
	 * @param dependencies - List of scheduled job {@link JobHandle job handles} that the current job depends on
	 * @returns The scheduled job's {@link JobHandle} allowing job completion and dependency definition
	 * 
	 * @example
	 * ```ts
	 * const jobHandleA: JobHandle = // jobA definition ...
	 * 	.schedule(); // schedules work to be done on a single background thread with no dependencies
	 * 
	 * const jobHandleB: JobHandle = // jobB definition ...
	 * 	.schedule();
	 * 
	 * const jobHandleC: JobHandle = // jobC definition ...
	 * 	.schedule(jobHandleA, jobHandleB); // schedules work to be done on a single background thread with jobA and jobB as dependencies
	 * 
	 * await jobHandleC.complete(); // ensure all three jobs are complete
	 * console.log(jobHandleA.isComplete); // true - jobHandleA.complete has been called by jobHandleC.complete
	 * console.log(jobHandleB.isComplete); // true - jobHandleB.complete has been called by jobHandleC.complete
	 * console.log(jobHandleC.isComplete); // true
	 * ```
	 */
	schedule(...dependencies: JobHandle[]): JobHandle;
	/**
	 * Completes the job's dependencies (if any) and performs the work on the main thread.
	 * 
	 * @remarks
	 * Useful when access to main thread APIs is required or there is light work to be performed on the main thread, depending on data that is being processed on background threads.
	 * 
	 * Awaiting this method also {@link JobHandle.complete completes} any dependencies the current job has.
	 * 
	 * @example
	 * ```ts
	 * const jobA = // jobA definition ...
	 * 
	 * await jobA.run();
	 * ```
	 */
	run(): Promise<void>;
}

/**
 * Job extension allowing parallel execution of a job on one or more background threads.
 * 
 * @remarks
 * Jobs operating on lists can be parallelized, allowing the same operation to be performed on each member of the list independently on separate background threads.
 */
export interface ParallelJob extends Job {
	/**
	 * Schedules the job for execution on multiple background threads, parallel to the main thread and other jobs.
	 * 
	 * @remarks
	 * Once a job has been scheduled, it cannot be cancelled. The returned {@link JobHandle} allows job completion, as well as allowing current job to be used as dependency for other jobs.
	 * 
	 * Jobs that run on background threads do NOT have access to main thread APIs. Jobs that require access to main thread APIs should be {@link Job.run ran} rather than scheduled.
	 * 
	 * If scheduleParallel is called in a singlethreaded {@link World world}, the method will perform the work on the main thread and return a completed {@link JobHandle}.
	 * 
	 * @see
	 * {@link Job.schedule}
	 * 
	 * @param dependencies - List of scheduled job {@link JobHandle job handles} that the current job depends on
	 * @returns The scheduled job's {@link JobHandle} allowing job completion and dependency definition
	 * 
	 * @example
	 * ```ts
	 * const jobHandleA = // jobA definition ...
	 * 	.scheduleParallel();
	 * 
	 * const jobHandleB = // jobB definition ...
	 * 	.scheduleParallel(jobHandleA); // schedule jobB for execution on multiple background threads will a dependency on jobA
	 * ```
	 */
	scheduleParallel(...dependencies: JobHandle[]): JobHandle;
}

/**
 * @internal
 * Creates a completed {@link JobHandle}.
 * 
 * @remarks
 * Used internally to ensure consistency in APIs in a singlethreaded {@link World world}.
 * 
 * @returns A completed {@link JobHandle}
 */
export const createNullHandle = (): JobHandle => ({
	id: -1,
	isComplete: true,
	complete: async () => {},
});
