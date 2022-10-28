import { WorkerPool } from '../src/index';

describe('worker-pool', () => {
	const threads = 5;
	let pool: WorkerPool;

	it('Creates a worker pool from passed parameters', () => {
		expect(() => {
			pool = new WorkerPool({ threads });
		}).not.toThrow();
	});

	it('Does not allow less than 1 thread', () => {
		expect(() => new WorkerPool({ threads: 0 })).toThrow(
			`Cannot construct ${WorkerPool.name}: number of workers cannot be less than one (passed 0)`
		);
	});

	it('Has a number of workers equal to the passed threads option', () => {
		expect(pool.workersCount).toEqual(5);
	});

	it('Can create async runnable tasks with passed params and return values', async () => {
		const add = pool.createTask(([a, b]: [a: number, b: number]): number => a + b);
		const sub = pool.createTask(([a, b]: [a: number, b: number]): number => a - b);
		const mul = pool.createTask(([a, b]: [a: number, b: number]): number => a * b);

		const [addRes, mulRes, subRes] = await Promise.all([add.run([5, 4]), mul.run([2, 4]), sub.run([100, 34])]);

		expect(addRes).toEqual(9);
		expect(mulRes).toEqual(8);
		expect(subRes).toEqual(66);
	});

	it('Can be safely disposed of', async () => {
		await pool.dispose();

		expect(pool.workersCount).toEqual(0);
		expect(pool.isDisposed).toEqual(true);
	});

	it('Cannot be disposed of twice', async () => {
		pool = new WorkerPool({ threads: 2 });

		await pool.dispose();
		expect(pool.dispose()).rejects.toThrow('Cannot dispose of already disposed WorkerPool');
	});

	// it('Can accept a string of functions and classes definitions to be used in worker scopes', async () => {
	// 	const workerScopeDefinitions = [
	// 		class Utils {
	// 			static add(a: number, b: number): number {
	// 				return a + b;
	// 			}
	// 			static mul(a: number, b: number): number {
	// 				return a * b;
	// 			}
	// 		},
	// 		function sub(a: number, b: number) {
	// 			return a - b;
	// 		},
	// 	];

	// 	const workerScript = workerScopeDefinitions.map((def) => def.toString()).join(' ');

	// 	pool = new WorkerPool({
	// 		threads: 3,
	// 		workerScript,
	// 	});

	// 	// @ts-ignore
	// 	const invokeAdd = pool.createTask(([a, b]: number[]) => Utils.add(a, b));
	// 	// @ts-ignore
	// 	const invokeMul = pool.createTask(([a, b]: number[]) => Utils.mul(a, b));
	// 	// @ts-ignore
	// 	const invokeSub = pool.createTask(([a, b]: number[]) => sub(a, b));
	// 	const [addRes, mulRes, subRes] = await Promise.all([
	// 		invokeAdd.run([1, 2]),
	// 		invokeMul.run([4, 5]),
	// 		invokeSub.run([100, 43]),
	// 	]);

	// 	expect(addRes).toEqual(3);
	// 	expect(mulRes).toEqual(20);
	// 	expect(subRes).toEqual(57);

	// 	await pool.dispose();
	// });
});
