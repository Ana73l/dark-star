import { $size } from '@dark-star/core';
import { Schema } from '../../core/src';
import { serializable, int8, float64, int16, int32, createSharedObject, createSharedObjectArray } from '../src/index';

describe('shared-object', () => {
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

	const schemaSize = (ComponentA as Schema)[$size]!;

	describe('createSharedObject', () => {
		it('Writes to an ArrayBuffer', () => {
			const buffer = new SharedArrayBuffer(schemaSize);
			const view = new DataView(buffer);
			const instance = createSharedObject(ComponentA, buffer, 0);
			instance.id = 5;
			instance.x = 10;
			instance.y = 13;
			instance.z = 60;

			expect(view.getInt8(0)).toBe(5);
			expect(view.getFloat64(1, true)).toBe(10);
			expect(view.getInt16(9, true)).toBe(13);
			expect(view.getInt32(11, true)).toBe(60);
		});
	});

	describe('createSharedObjectArray', () => {
		it('Writes to an ArrayBuffer', () => {
			const length = 10;
			const buffer = new SharedArrayBuffer(schemaSize * length);
			const view = new DataView(buffer);
			const array = createSharedObjectArray(ComponentA, buffer, { length });
			array[0].id = 5;
			array[0].x = 10;
			array[0].y = 13;
			array[0].z = 60;

			expect(view.getInt8(0)).toBe(5);
			expect(view.getFloat64(1, true)).toBe(10);
			expect(view.getInt16(9, true)).toBe(13);
			expect(view.getInt32(11, true)).toBe(60);
		});
	});
});
