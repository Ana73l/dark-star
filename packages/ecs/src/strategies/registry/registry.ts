import { Nullable } from '../../types';
import { Entity } from '../../entity';
import { ComponentType, ComponentTypesQuery, ComponentInstancesFromQuery } from '../../component';
import { QueryRecord } from '../../query';

export interface Registry {
    registerEntity<T extends ComponentTypesQuery>(entity: Entity, components: ComponentInstancesFromQuery<T>): void;
    unregisterEntity(entity: Entity): InstanceType<ComponentType>[];
    exists(entity: Entity): boolean;

    hasComponent<T extends ComponentType>(entity: Entity, componentType: T): boolean;
    hasAnyComponent<T extends ComponentTypesQuery>(entity: Entity, componentTypes: T): boolean;
    hasAllComponents<T extends ComponentTypesQuery>(entity: Entity, componentTypes: T): boolean;

    getComponent<T extends ComponentType>(entity: Entity, componentType: T): Nullable<InstanceType<T>>;
    getComponents(entity: Entity): InstanceType<ComponentType>[];

    attachComponents<T extends ComponentTypesQuery>(entity: Entity, components: ComponentInstancesFromQuery<T>): void;
    detachComponents<T extends ComponentTypesQuery>(entity: Entity, components: T): ComponentInstancesFromQuery<T>;

    registerQuery<
        TAll extends ComponentTypesQuery,
        TSome extends ComponentTypesQuery = [],
        TNone extends ComponentTypesQuery = []
    >(
        all: TAll,
        some?: TSome,
        none?: TNone
    ): QueryRecord<TAll, TSome>[];
}
