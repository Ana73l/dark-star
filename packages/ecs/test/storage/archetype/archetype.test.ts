import { Archetype } from '../../../src/storage/archetype/archetype';

import { Position } from '../../__components__/position';
import { Velocity } from '../../__components__/velocity';

describe('archetype', () => {
	it('Can initialize Archetype with component types', () => {
		expect(() => new Archetype(new Set([Position, Velocity]), 0)).not.toThrow();
	});

	it('Can initialize Archetype without component types', () => {
		expect(() => new Archetype(new Set(), 0)).not.toThrow();
	});

	describe('count', () => {
		it('Returns the number of entities registered in the archetype chunks', () => {
			expect(new Archetype(new Set(), 0).count).toEqual(0);
		});
	});
});
