import { Schema, $offset, $size, $view, assignViewToInstance, assert } from '@dark-star/core';

/**
 * Represents an array of schemas. Readonly because buffers have fixed size.
 * If array length is reached a new SharedObjectArray should be created to store extra data.
 */
export type SharedObjectArray<T extends Schema & (new () => any)> = ReadonlyArray<InstanceType<T>> & {
	/**
	 * @hidden
	 */
	[$view]: DataView;
	/**
	 * @hidden
	 */
	[$offset]: number;
};

export function createSharedObjectArray<T extends Schema & (new () => any)>(
	schemaType: T,
	buffer?: ArrayBuffer,
	{ offset = 0, length = 0 } = {}
): SharedObjectArray<T> {
	const schemaSize = schemaType[$size]!;
	if (!buffer) {
		buffer = new SharedArrayBuffer(schemaSize * length);
		offset = 0;
	}
	const view = new DataView(buffer, offset);
	let stride = 0;

	if (!length) {
		length = Math.floor((buffer.byteLength - offset) / schemaSize);
	}

	const array = new Array(length);
	let i;

	for (i = 0; i < length; i++) {
		const schemaInstance = assignViewToInstance(new schemaType(), view, stride);

		array[i] = schemaInstance;

		stride += schemaSize;
	}

	return Object.freeze(
		Object.assign(array, {
			[$view]: view,
			[$offset]: offset,
		})
	) as SharedObjectArray<T>;
}

export function createSharedObject<T extends Schema & (new () => any)>(
	schemaType: T,
	buffer?: ArrayBuffer,
	offset: number = 0
): InstanceType<T> {
	if (!buffer) {
		buffer = new SharedArrayBuffer(schemaType[$size]!);
		offset = 0;
	}

	return assignViewToInstance(new schemaType(), new DataView(buffer, offset), offset);
}
