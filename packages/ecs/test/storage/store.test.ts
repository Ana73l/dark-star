import { EntityStore } from '../../src/storage/store';

import { Position } from '../__components__/position';
import { Velocity } from '../__components__/velocity';

describe('EntityStore', () => {
	let store: EntityStore;

	it('Initializes an EntityStore', () => {
		expect(() => {
			store = new EntityStore();
		}).not.toThrow();
	});

	describe('createEntity', () => {
		it('Creates an entity and returns an unique entity id', () => {
			expect(store.createEntity()).toBe(1);
			expect(store.createEntity([Position, Velocity])).toBe(2);
			expect(store.createEntity([Position])).toBe(3);
		});
	});

	describe('destroyEntity', () => {
		it('Destroys a valid entity', () => {
			expect(() => store.destroyEntity(1)).not.toThrow();
		});

		it('Throws when invalid entity is passed', () => {
			expect(() => store.destroyEntity(1)).toThrow('Cannot destroy entity 1 - entity does not exist');
		});
	});

	describe('exists', () => {
		it('Checks whether an entity exists', () => {
			expect(store.exists(1)).toBe(false);
			expect(store.exists(2)).toBe(true);
		});
	});

	describe('hasComponent', () => {
		it('Checks whether an entity has a given component type attached', () => {
			expect(store.hasComponent(2, Position)).toBe(true);
			expect(store.hasComponent(2, Velocity)).toBe(true);
			expect(store.hasComponent(3, Position)).toBe(true);
			expect(store.hasComponent(3, Velocity)).toBe(false);
		});
	});

	describe('hasAnyComponent', () => {
		it('Checks whether an entity has any component type attached from a list of component types', () => {
			expect(store.hasAnyComponent(2, [Position, Velocity])).toBe(true);
			expect(store.hasAnyComponent(3, [Position, Velocity])).toBe(true);
			expect(store.hasAnyComponent(3, [Velocity])).toBe(false);
			expect(store.hasAnyComponent(1, [Position, Velocity])).toBe(false);
		});
	});

	describe('hasAllComponents', () => {
		it('Checks whether an entity has all component types attached', () => {
			expect(store.hasAllComponents(2, [Position, Velocity])).toBe(true);
			expect(store.hasAllComponents(1, [Position, Velocity])).toBe(false);
			expect(store.hasAllComponents(3, [Position, Velocity])).toBe(false);
			expect(store.hasAllComponents(3, [Position])).toBe(true);
		});
	});

	describe('getComponent', () => {
		it('Retrieves the component instance attached to an entity of a given component type', () => {
			expect(store.getComponent(2, Position)).not.toBeFalsy();
			expect(store.getComponent(2, Velocity)).not.toBeFalsy();
			expect(store.getComponent(3, Position)).not.toBeFalsy();
			expect(store.getComponent(3, Velocity)).toBeUndefined();
			expect(store.getComponent(1, Position)).toBeUndefined();
		});
	});

	describe('attachComponents', () => {
		afterEach(() => store.detachComponents(3, [Velocity]));

		it('Attaches components to a given entity by a list of component type', () => {
			store.attachComponents(3, [Velocity]);

			expect(store.getComponent(3, Velocity)).not.toBeFalsy();
		});

		it('Throws if entity does not exist', () => {
			expect(() => store.attachComponents(1, [Position])).toThrow('Error attaching components to entity 1 - entity does not exist');
		});
	});

	describe('detachComponents', () => {
		it('Detaches given component types of an entity', () => {
			store.attachComponents(3, [Velocity]);

			store.detachComponents(3, [Velocity]);
			expect(store.hasComponent(3, Velocity)).toBe(false);
		});

		it('Throws if entity does not exist', () => {
			expect(() => store.detachComponents(1, [Position])).toThrow('Error detaching components from entity 1 - entity does not exist');
		});
	});
});
