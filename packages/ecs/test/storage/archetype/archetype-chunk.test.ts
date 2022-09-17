import { $id, $size } from '@dark-star/core';

import { $entitiesArray, $componentsTable } from '../../../src/storage/archetype/__internals__';
import { ArchetypeChunk } from '../../../src/storage/archetype/archetype-chunk';

import { Position } from '../../__components__/position';
import { Velocity } from '../../__components__/velocity';

describe('archetype-chunk', () => {
	const capacity = 50;
	const chunk = new ArchetypeChunk([Position, Velocity], capacity, 0);

	describe('entities', () => {
		const entities = chunk[$entitiesArray];

		it('Length is equal to chunk capacity', () => {
			expect(entities.length).toEqual(capacity);
		});

		it('Size is equal to chunk size', () => {
			expect(entities.size).toEqual(chunk[$size]);
			chunk[$size] = 1;

			expect(entities.size).toEqual(chunk[$size]);
			chunk[$size] = 0;
			expect(entities.size).toEqual(chunk[$size]);
		});
	});

	describe('components-table', () => {
		const components = chunk[$componentsTable];

		it('Number of rows is equal to number of component types stored in the chunk', () => {
			expect(components.length).toEqual(2);
		});

		it('Each row (components of type) has length equal to chunk capacity', () => {
			for (const row of components) {
				expect(row.length).toEqual(capacity);
			}
		});

		it('Index of component type row is equal to index of component type when creating the chunk', () => {
			expect(components[0][0].constructor).toEqual(Position);
			expect(components[1][0].constructor).toEqual(Velocity);
		});
	});

	describe('capacity', () => {
		it('Is fixed to the initially passed value', () => {
			expect(chunk.capacity).toEqual(capacity);
		});
	});

	describe('size', () => {
		it('Returns privately set size', () => {
			expect(chunk.size).toEqual(chunk[$size]);
			chunk[$size] = Math.random();
			expect(chunk.size).toEqual(chunk[$size]);
			chunk[$size] = 0;
			expect(chunk.size).toEqual(chunk[$size]);
		});
	});

	describe('full', () => {
		it('Returns true when size equals capacity', () => {
			expect(chunk.full).toEqual(false);
			chunk[$size] = capacity;
			expect(chunk.full).toEqual(true);
			chunk[$size] = 0;
			expect(chunk.full).toEqual(false);
		});
	});

	describe('getComponentArray', () => {
		it('Returns undefined if component type is not in chunk', () => {
			expect(chunk.getComponentArray(100000)).toBeUndefined();
		});

		it('Returns component array by component constructor', () => {
			const array = chunk.getComponentArray(Position)!;

			expect(array).toBeDefined();
			expect(array[0].constructor).toEqual(Position);
			expect(array.length).toEqual(capacity);
		});

		it('Returns component array by component type id', () => {
			// @ts-ignore
			const id = Position[$id];
			const array = chunk.getComponentArray(id)!;

			expect(array).toBeDefined();
			expect(array[0].constructor).toEqual(Position);
		});
	});

	describe('getEntitiesArray', () => {
		it('Returns the private entities array', () => {
			expect(chunk.getEntitiesArray()).toStrictEqual(chunk[$entitiesArray]);
		});
	});
});
