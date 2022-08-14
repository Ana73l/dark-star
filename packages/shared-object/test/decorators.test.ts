import { $definition, $id, $size, Schema, PrimitiveTypes, schemas } from '@dark-star/core';
import { serializable, int8, float64, int16, int32, string16, schema } from '../src/index';

describe('decorators', () => {
	const oldSchemasSize = schemas.length;

	@serializable()
	class ComponentA {
		@int8()
		id: number = 0;

		@float64()
		x: number = 0;

		@int16()
		y: number = 0;

		@int32()
		z: number = 0;
	}

	@serializable()
	class ComponentB {
		@string16()
		name: string = '';

		@schema(ComponentA)
		componentA!: ComponentA;
	}

	it('Register in internal list of schemas', () => {
		expect(schemas.length).toEqual(oldSchemasSize + 2);
		expect(schemas[oldSchemasSize]).toEqual(ComponentA);
		expect(schemas[oldSchemasSize + 1]).toEqual(ComponentB);
	});

	it('Calculate correct schema size', () => {
		const expectedSizeA =
			Uint8Array.BYTES_PER_ELEMENT +
			Float64Array.BYTES_PER_ELEMENT +
			Int16Array.BYTES_PER_ELEMENT +
			Int32Array.BYTES_PER_ELEMENT;

		const expectedSizeB = 2 + expectedSizeA;

		expect((ComponentA as Schema)[$size]).toEqual(expectedSizeA);
		expect((ComponentB as Schema)[$size]).toEqual(expectedSizeB);
	});

	it('Set correct schema id', () => {
		expect((ComponentA as Schema)[$id]).toEqual(oldSchemasSize + 1);
		expect((ComponentB as Schema)[$id]).toEqual(oldSchemasSize + 2);
	});

	it('Set correct definition', () => {
		expect(JSON.stringify((ComponentA as Schema)[$definition])).toEqual(
			JSON.stringify({
				id: {
					type: PrimitiveTypes.Int8,
				},
				x: {
					type: PrimitiveTypes.Float64,
					args: [true],
				},
				y: {
					type: PrimitiveTypes.Int16,
					args: [true],
				},
				z: {
					type: PrimitiveTypes.Int32,
					args: [true],
				},
			})
		);
		expect(JSON.stringify((ComponentB as Schema)[$definition])).toEqual(
			JSON.stringify({
				name: {
					type: PrimitiveTypes.String16,
				},
				componentA: {
					type: PrimitiveTypes.Schema,
					args: [(ComponentA as Schema)[$id]],
				},
			})
		);
	});
});
