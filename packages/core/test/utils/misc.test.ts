import { UINT32_MAX, createUIDGenerator, assert } from '../../src/utils/misc';

describe('misc', () => {
	describe('createUIDGenerator', () => {
		let uid: any;

		afterEach(() => {
			if (uid) {
				uid = undefined;
			}
		});

		it('Creates a function returning unique incremented integers after each call, starting with first values passed (default 1)', () => {
			uid = createUIDGenerator();

			expect(uid()).toEqual(1);
			expect(uid()).toEqual(2);
			expect(uid()).toEqual(3);

			uid = createUIDGenerator(4);

			expect(uid()).toEqual(4);
			expect(uid()).toEqual(5);
		});

		it('Returns null if incremented value reaches UINT_MAX (4294967295)', () => {
			uid = createUIDGenerator(UINT32_MAX - 1);

			expect(uid()).toEqual(UINT32_MAX - 1);
			expect(uid()).toEqual(null);
		});
	});

	describe('assert', () => {
		it('Does not throw error if expression is truthy', () => {
			expect(() => assert(Math.round(2) === 2)).not.toThrow();
			expect(() => assert('1' === '1')).not.toThrow();
		});

		it('Throws custom error if expression is falsy', () => {
			const err = 'Values are not equal';

			expect(() => {
				assert(Math.round(2) === 1, err);
			}).toThrow(err);
		});
	});
});
