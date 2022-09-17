import { Archetype } from '../../../src/storage/archetype/archetype';

import { Position } from '../../__components__/position';
import { Velocity } from '../../__components__/velocity';

describe('archetype', () => {
	const archetype = new Archetype(new Set([Position, Velocity]), 0);

	describe('count', () => {
		it('It returns the number of entities registered in the archetype chunks', () => {
			expect(archetype.count).toEqual(0);
		});
	});
});
