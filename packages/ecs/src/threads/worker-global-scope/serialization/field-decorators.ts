import {
	PrimitiveTypes,
	bigInt64,
	bigUint64,
	bool,
	float32,
	float64,
	int16,
	int32,
	int8,
	schema,
	string16,
	string8,
	uint16,
	uint32,
	uint8,
	TypedFieldDecoratorFactory,
} from '@dark-star/schema';

export const fieldDecorators: Record<
	PrimitiveTypes,
	TypedFieldDecoratorFactory<any>
> = {
	[PrimitiveTypes.Int8]: int8,
	[PrimitiveTypes.Uint8]: uint8,
	[PrimitiveTypes.Int16]: int16,
	[PrimitiveTypes.Uint16]: uint16,
	[PrimitiveTypes.Int32]: int32,
	[PrimitiveTypes.Uint32]: uint32,
	[PrimitiveTypes.Float32]: float32,
	[PrimitiveTypes.Float64]: float64,
	[PrimitiveTypes.BigInt64]: bigInt64,
	[PrimitiveTypes.BigUint64]: bigUint64,
	[PrimitiveTypes.Boolean]: bool,
	[PrimitiveTypes.String8]: string8,
	[PrimitiveTypes.String16]: string16,
	[PrimitiveTypes.Schema]: schema,
};
