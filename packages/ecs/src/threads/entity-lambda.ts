import { ComponentType } from '../component';
import { Entity } from '../entity';
import { ComponentTypesQuery, ComponentInstancesFromTypes } from '../query';

export enum EntityLambdaTypes {
	Each,
	EachWithEntities,
}

export type EntityEachLambda<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypesQuery,
	TSome extends ComponentTypesQuery = [],
	TNone extends ComponentType[] = []
	// @ts-ignore
> = (...components: ComponentInstancesFromTypes<T, TAll, TSome, TNone>) => void;

export type EntityEachLambdaWithEntities<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypesQuery,
	TSome extends ComponentTypesQuery = [],
	TNone extends ComponentType[] = []
> = (
	entity: Entity,
	// @ts-ignore
	...components: ComponentInstancesFromTypes<T, TAll, TSome, TNone>
) => void;

export type EntityLambda<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypesQuery,
	TSome extends ComponentTypesQuery = [],
	TNone extends ComponentType[] = []
> = EntityEachLambda<T, TAll, TSome, TNone> | EntityEachLambdaWithEntities<T, TAll, TSome, TNone>;
