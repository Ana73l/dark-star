import { PrimitiveTypes, Schema, SchemaInstance } from './schema';
import {
	$definition,
	$size,
	$view,
	$values,
	$offset,
	assignViewToInstance,
	registerSchema,
	$id,
} from './_internals_';

export type TypedFieldDecorator<T extends any> = <
	K extends string,
	V extends Schema & Record<K, T>
>(
	target: SchemaInstance<V>,
	property: K
) => void;

export type TypedFieldDecoratorFactory<T extends any> = (
	...args: any[]
) => TypedFieldDecorator<T>;

export const int8 =
	(): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Int8,
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getInt8(this[$offset] + offset)
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setInt8(this[$offset] + offset, value);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Int8Array.BYTES_PER_ELEMENT + offset;
	};

export const uint8 =
	(): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Uint8,
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getUint8(this[$offset] + offset)
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setInt8(this[$offset] + offset, value);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Uint8Array.BYTES_PER_ELEMENT + offset;
	};

export const int16 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Int16,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getInt16(this[$offset] + offset, littleEndian)
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setInt16(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Int16Array.BYTES_PER_ELEMENT + offset;
	};

export const uint16 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Uint16,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getUint16(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setUint16(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Uint16Array.BYTES_PER_ELEMENT + offset;
	};

export const int32 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Int32,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getInt32(this[$offset] + offset, littleEndian)
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setInt32(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Int32Array.BYTES_PER_ELEMENT + offset;
	};

export const uint32 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Uint32,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].setUint32(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].getUint32(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Uint32Array.BYTES_PER_ELEMENT + offset;
	};

export const float32 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Float32,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getFloat32(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setFloat32(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Float32Array.BYTES_PER_ELEMENT + offset;
	};

export const float64 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.Float64,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getFloat64(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setFloat64(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Float64Array.BYTES_PER_ELEMENT + offset;
	};

export const bigInt64 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.BigInt64,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getBigInt64(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setBigInt64(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = BigInt64Array.BYTES_PER_ELEMENT + offset;
	};

export const bigUint64 =
	(littleEndian: boolean = true): TypedFieldDecorator<number> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.BigUint64,
			args: [littleEndian],
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				return this[$view]
					? this[$view].getBigUint64(
							this[$offset] + offset,
							littleEndian
					  )
					: (this[$values] && this[$values][property]) || 0;
			},
			set(value: number) {
				if (this[$view]) {
					this[$view].setBigUint64(
						this[$offset] + offset,
						value,
						littleEndian
					);
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = BigUint64Array.BYTES_PER_ELEMENT + offset;
	};

export const bool = (): TypedFieldDecorator<boolean> => (target, property) => {
	const ctor = target.constructor;
	const fields = (ctor[$definition] = ctor[$definition] || {});

	fields[property] = {
		type: PrimitiveTypes.Boolean,
	};

	const offset = ctor[$size] || 0;

	Object.defineProperty(target, property, {
		enumerable: true,
		get() {
			return this[$view]
				? !!this[$view].getUint8(this[$offset] + offset)
				: (this[$values] && this[$values][property]) || false;
		},
		set(value: boolean) {
			if (this[$view]) {
				this[$view].setUint8(this[$offset] + offset, +value);
			}

			if (this[$values]) {
				this[$values][property] = value;
			} else {
				this[$values] = { [property]: value };
			}
		},
	});

	ctor[$size] = Uint8Array.BYTES_PER_ELEMENT + offset;
};

export const string8 =
	(): TypedFieldDecorator<string> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.String8,
		};

		const offset = ctor[$size] || 0;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				if (this[$view]) {
					let value = '';
					let stride = this[$offset] + offset;
					const size = (this[$values][property] || '').length;
					let i;

					for (i = 0; i < size; i++) {
						const charCode = this[$view].getUint8(stride);
						if (charCode === 0) {
							break;
						}

						value += String.fromCharCode(charCode);
						stride++;
					}

					return value;
				} else {
					return (this[$values] && this[$values][property]) || '';
				}
			},
			set(value: string) {
				if (value === undefined || value === null) {
					return;
				}

				if (this[$view]) {
					let stride = this[$offset] + offset;
					const size = value.length;
					let i;

					for (i = 0; i < size; i++) {
						this[$view].setUint8(stride, value[i].charCodeAt(0));
						stride++;
					}
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Uint8Array.BYTES_PER_ELEMENT + offset;
	};

export const string16 =
	(): TypedFieldDecorator<string> =>
	(target, property): void => {
		const ctor = target.constructor;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		fields[property] = {
			type: PrimitiveTypes.String16,
		};

		const offset = ctor[$size] || 0;
		const byteLength = 2;

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				if (this[$view]) {
					let value = '';
					let stride = this[$offset] + offset;
					const size = (this[$values][property] || '').length;
					let i;

					for (i = 0; i < size; i++) {
						const charCode = this[$view].getUint16(stride);
						if (charCode === 0) {
							break;
						}

						value += String.fromCharCode(charCode);
						stride += byteLength;
					}

					return value;
				} else {
					return (this[$values] && this[$values][property]) || '';
				}
			},
			set(value: string) {
				if (value === undefined || value === null) {
					return;
				}

				if (this[$view]) {
					let stride = this[$offset] + offset;
					const size = value.length;
					let i;

					for (i = 0; i < size; i++) {
						this[$view].setUint16(stride, value[i].charCodeAt(0));
						stride += byteLength;
					}
				}

				if (this[$values]) {
					this[$values][property] = value;
				} else {
					this[$values] = { [property]: value };
				}
			},
		});

		ctor[$size] = Uint16Array.BYTES_PER_ELEMENT + offset;
	};

export const schema =
	<T extends Schema & (new () => any)>(
		schemaType: T
	): (<K extends string, V extends Schema & Record<K, InstanceType<T>>>(
		target: SchemaInstance<V>,
		property: K
	) => void) =>
	(target, property): void => {
		const ctor = target.constructor as Schema;
		const fields = (ctor[$definition] = ctor[$definition] || {});

		const offset = ctor[$size] || 0;

		fields[property] = {
			type: PrimitiveTypes.Schema,
			args: [schemaType[$id]],
		};

		Object.defineProperty(target, property, {
			enumerable: true,
			get() {
				if (!this[$values][property]) {
					this[$values][property] = new schemaType();
				}

				const instance: T = this[$values][property];

				if (this[$view] !== this[$values][property][$view]) {
					assignViewToInstance(
						instance,
						this[$view],
						this[$offset] + offset
					);
				}

				return instance;
			},
			set(value: Partial<T>) {
				if (!value) {
					return;
				}

				const newValue = Object.assign(this[property], value);

				this[$values][property] = newValue;
			},
		});

		ctor[$size] = offset + schemaType[$size]!;
	};

export const serializable: () => <T extends Schema & (new () => any)>(
	target: T
) => T = () => (target) => {
	registerSchema(target);

	target.prototype.toJSON = function () {
		const result: Record<string, any> = {};
		const fields = Object.entries(target[$definition] || {});

		for (const [name] of fields) {
			result[name] = this[name];
		}

		return result;
	};

	return target;
};
