import { Entity } from '../entity';
import { ComponentTypesQuery, ComponentInstancesFromQuery, ComponentTypes } from '../query';
import { ECSEachJob } from '../system/ecs-jobs/ecs-each';

export type EntityEachLambda<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>) => void;

export type EntityEachLambdaWithEntities<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes
> = (entity: Entity, components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>) => void;
