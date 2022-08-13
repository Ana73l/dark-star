# @dark-star/shared-object

`SharedObject` creates objects that can read or write to an ArrayBuffer. It takes a decorated class constructor as a schema for (de)serializing data seemlessly.

-   Serializes/deserializes complex structures to ArrayBuffer
-   Caches value to be reused between buffer reassignments
-   Supports nested structures

## Install

    npm i @dark-star/shared-object

## API

### Single object

```ts
import {
	serializable,
	string16,
	int8,
	float64,
	schema,
	createdSharedObject,
} from '@dark-star/shared-object';

@serializable()
class Vector3 {
	@float64()
	x!: number;

	@float64()
	y!: number;

	@float64()
	z!: number;
}

@serializable()
class Entity {
	@int8()
	id!: number;

	@string16()
	name!: string;

	@schema(Vector3)
	position!: Vector3;
}

const buffer = new ArrayBuffer(100);
const player = createdSharedObject(Entity, buffer);
```

### Array of schemas

```ts
import {
	serializable,
	float64,
	createSharedObjectArray,
} from '@dark-star/shared-object';

@serializable()
class Vector3 {
	@float64()
	x!: number;

	@float64()
	y!: number;

	@float64()
	z!: number;
}
/**
 * 8 bytes * 3 fields * 100 array length
 */
const buffer = new ArrayBuffer(8 * 3 * 100);
const vectors = createSharedObjectArray(Vector3, buffer, {
	length: 100,
});
```
