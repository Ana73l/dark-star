import { Entity } from '../entity';
import { ComponentTypesQuery, ComponentInstancesFromQuery, ComponentTypes } from '../query';

export type EntityEachLambda<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>) => void;

export type EntityEachLambdaWithParams<
	T extends ComponentTypesQuery,
	P extends any[],
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>, params: P) => void;

export type EntityEachLambdaWithEntities<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (entity: Entity, components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>) => void;

export type EntityEachLambdaWithEntitiesAndParams<
	T extends ComponentTypesQuery,
	P extends any[],
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (entity: Entity, components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>, params: P) => void;
