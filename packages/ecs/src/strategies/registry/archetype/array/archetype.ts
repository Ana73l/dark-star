import { Entity } from '../../../../entity';
import {
    ComponentInstancesFromQuery,
    ComponentType,
    ComponentTypeId,
    ComponentTypesQuery
} from '../../../../component';
import { assert } from '../../../../utils/misc';

import { Signature } from '../signature';

export type ComponentsTable = Map<ComponentTypeId, InstanceType<ComponentType>[]>;
export type Archetype = {
    signature: Signature;
    entities: Entity[];
    entityToIndex: Record<Entity, number>;
    componentsTable: ComponentsTable;
};

export type ArchetypeOptions = {
    signature: Signature;
};

export const createArchetype = ({ signature }: ArchetypeOptions): Archetype => {
    const entities: Entity[] = [];
    const entityToIndex: Record<Entity, number> = {};
    const componentsTable: ComponentsTable = new Map();

    for (const componentType of signature) {
        componentsTable.set(componentType, []);
    }

    return {
        signature,
        entities,
        entityToIndex,
        componentsTable
    };
};

export const addEntityToArchetype = <T extends ComponentTypesQuery>(
    archetype: Archetype,
    entity: Entity,
    components: ComponentInstancesFromQuery<T>
): number => {
    const { entities, entityToIndex, componentsTable } = archetype;
    const entityIndex = entityToIndex[entity];
    // if entity is already contained do nothing
    assert(entityIndex === undefined, 'Entity already registered in archetype');

    const newEntityIndex = entities.push(entity) - 1;

    components.forEach((component: InstanceType<ComponentType>) =>
        componentsTable.get(component.constructor.id)?.push(component)
    );

    entityToIndex[entity] = newEntityIndex;

    return newEntityIndex;
};

export const removeEntityFromArchetype = (archetype: Archetype, entity: Entity): InstanceType<ComponentType>[] => {
    const { entities, entityToIndex, componentsTable } = archetype;
    const components: InstanceType<ComponentType>[] = [];
    const toRemoveIndex = entityToIndex[entity];

    // if entity does not exist return empty array of components
    assert(toRemoveIndex !== undefined, 'Entity not registered in archetype');

    const lastElementIndex = entities.length - 1;
    const lastElementEntity = entities[lastElementIndex];

    // copy element at end into deleted element's place to prevent gaps
    entities[toRemoveIndex] = entities[lastElementIndex];

    for (const [componentType, componentArray] of componentsTable) {
        // push the component in the back of the array
        components.push(componentArray[toRemoveIndex]);
        componentArray[toRemoveIndex] = componentArray[lastElementIndex];
        componentArray.length -= 1;
    }

    // update map to point to new positions
    entityToIndex[lastElementEntity] = toRemoveIndex;
    delete entityToIndex[entity];

    entities.length -= 1;

    return components;
};
