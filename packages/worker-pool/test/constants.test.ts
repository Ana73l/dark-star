import { CORES_COUNT } from '../src/index';

describe('constants', () => {
	describe('CORES_COUNT', () => {
		it('Is a number value', () => {
			expect(CORES_COUNT).not.toBeNaN();
		});
	});
});
