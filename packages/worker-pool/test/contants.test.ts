import { coresCount } from '../src/index';

describe('constants', () => {
	describe('coresCount', () => {
		it('Is a number value', () => {
			expect(coresCount).not.toBeNaN();
		});
	});
});
