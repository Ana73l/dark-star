import { Entity } from '../entity';
import { ComponentTypesQuery, ComponentInstancesFromQuery, ComponentTypes } from '../query';
import { JobArgs, JobCallbackMappedArgs } from './jobs/job';

export type EntityEachLambda<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes,
	P extends JobArgs | undefined
> = (components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>, params: JobCallbackMappedArgs<P>) => void;

export type EntityEachLambdaWithEntities<
	T extends ComponentTypesQuery,
	TAll extends ComponentTypes,
	TSome extends ComponentTypes,
	TNone extends ComponentTypes,
	P extends JobArgs | undefined
> = (entity: Entity, components: ComponentInstancesFromQuery<T, TAll, TSome, TNone>, params: JobCallbackMappedArgs<P>) => void;
