import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentTypesQuery, ComponentInstancesFromTypes, ComponentInstancesFromQuery } from '../query';

export enum EntityLambdaTypes {
	Each,
	EachWithEntities,
}

export type EntityEachLambda<
	T,
	TAll,
	TSome,
	TNone
	// @ts-ignore
> = (...components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>) => void;

export type EntityEachLambdaWithEntities<T, TAll, TSome, TNone> = (
	entity: Entity,
	// @ts-ignore
	...components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>
) => void;

export type EntityLambda<T, TAll, TSome, TNone> =
	| EntityEachLambda<T, TAll, TSome, TNone>
	| EntityEachLambdaWithEntities<T, TAll, TSome, TNone>;
