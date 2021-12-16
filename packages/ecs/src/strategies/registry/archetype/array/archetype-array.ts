import { Nullable } from '../../../../types';
import { Entity } from '../../../../entity';
import { assert } from '../../../../utils/misc';
import {
    ComponentType,
    ComponentTypesQuery,
    ComponentInstancesFromQuery,
    ComponentTypeId,
    ComponentTypesArrayFromQuerySignature
} from '../../../../component';
import {
    createSignature,
    Signature,
    signaturesMatch,
    typeIdsMatchSignature,
    anyTypeIdsMatchSignature
} from '../signature';
import { Archetype, createArchetype, addEntityToArchetype, removeEntityFromArchetype } from './archetype';
import { Registry } from '../../registry';
import { QueryRecord } from '../../../../query';

type Query<
    TAll extends ComponentTypesQuery,
    TSome extends ComponentTypesQuery = [],
    TNone extends ComponentTypesQuery = []
> = {
    layout: [ComponentTypeId[], ComponentTypeId[], ComponentTypeId[]];
    records: QueryRecord<TAll, TSome>[];
};

export class ArchetypeArray implements Registry {
    private entityToArchetypeIndex: Record<Entity, number> = {};
    private archetypes: Archetype[] = [];
    private queries: Query<ComponentTypesQuery, ComponentTypesQuery, ComponentTypesQuery>[] = [];

    public registerEntity<T extends ComponentTypesQuery>(
        entity: Entity,
        components: ComponentInstancesFromQuery<T>
    ): void {
        assert(this.entityToArchetypeIndex[entity] === undefined, 'Entity already registered.');

        const signature = createSignature(components.map((c: InstanceType<ComponentType>) => c.constructor));
        const [archetype, index] = this.findOrCreateArchetype(signature);

        addEntityToArchetype(archetype, entity, components);

        this.entityToArchetypeIndex[entity] = index;
    }

    public registerEntities<T extends ComponentTypesQuery>(
        entities: number[],
        components: ComponentInstancesFromQuery<T>[]
    ): void {
        const entitiesCount = entities.length;
        assert(entitiesCount === components.length, 'Entities and component instances lengths cannot differ');

        if (entitiesCount === 0) {
            return;
        }

        const firstRowOfComponents = components[0];
        const signature = createSignature(firstRowOfComponents.map((c: InstanceType<ComponentType>) => c.constructor));
        const [archetype, index] = this.findOrCreateArchetype(signature);

        let i;
        for (i = 0; i < entitiesCount; i++) {
            addEntityToArchetype(archetype, entities[i], components[i]);
            this.entityToArchetypeIndex[entities[i]] = index;
        }
    }

    public unregisterEntity(entity: Entity): InstanceType<ComponentType>[] {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        assert(archetypeIndex !== undefined, 'Entity not registered');

        const archetype = this.archetypes[archetypeIndex];

        const components = removeEntityFromArchetype(archetype, entity);

        delete this.entityToArchetypeIndex[entity];

        return components;
    }

    public exists(entity: Entity): boolean {
        return this.entityToArchetypeIndex[entity] ? true : false;
    }

    public hasComponent<T extends ComponentType>(entity: Entity, componentType: T): boolean {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        if (archetypeIndex === undefined) {
            return false;
        }

        return this.archetypes[archetypeIndex].signature.has(componentType.id as number);
    }

    public hasAnyComponent<T extends ComponentTypesQuery>(entity: Entity, componentTypes: T): boolean {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        if (archetypeIndex === undefined) {
            return false;
        }

        const signature = this.archetypes[archetypeIndex].signature;

        for (const componentType of componentTypes) {
            if (signature.has(componentType.id as number)) {
                return true;
            }
        }

        return false;
    }

    public hasAllComponents<T extends ComponentTypesQuery>(entity: Entity, componentTypes: T): boolean {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        if (archetypeIndex === undefined) {
            return false;
        }

        const signature = this.archetypes[archetypeIndex].signature;

        for (const componentType of componentTypes) {
            if (!signature.has(componentType.id as number)) {
                return false;
            }
        }

        return true;
    }

    public getComponent<T extends ComponentType>(entity: Entity, componentType: T): Nullable<InstanceType<T>> {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        assert(archetypeIndex !== undefined, 'Entity not registered');

        const componentTypeId = componentType.id as number;
        const archetype = this.archetypes[archetypeIndex];
        const entityIndex = archetype.entityToIndex[entity];

        return archetype.signature.has(componentTypeId)
            ? archetype.componentsTable.get(componentTypeId)?.[entityIndex]
            : null;
    }

    public getComponents(entity: Entity): InstanceType<ComponentType>[] {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        assert(archetypeIndex !== undefined, 'Entity not registered');

        const archetype = this.archetypes[archetypeIndex];

        const signature = archetype.signature;
        const componentsTable = archetype.componentsTable;

        const entityIndex = archetype.entityToIndex[entity];
        const components = new Array(signature.size).fill(null);
        let i = 0;

        for (const componentTypeId of signature) {
            components[i] = componentsTable.get(componentTypeId)?.[entityIndex];
            i++;
        }

        return components;
    }

    public attachComponents<T extends ComponentTypesQuery>(
        entity: Entity,
        components: ComponentInstancesFromQuery<T>
    ): void {
        const oldArchetypeIndex = this.entityToArchetypeIndex[entity];

        assert(oldArchetypeIndex !== undefined, 'Entity not registered');

        const oldArchetype = this.archetypes[oldArchetypeIndex];

        const oldComponents = removeEntityFromArchetype(oldArchetype, entity);
        oldComponents.concat(components);

        const newArchetypeSignature = createSignature(oldComponents.map((c) => c.constructor));
        const [newArchetype, newArchetypeIndex] = this.findOrCreateArchetype(newArchetypeSignature);

        addEntityToArchetype(newArchetype, entity, components);

        this.entityToArchetypeIndex[entity] = newArchetypeIndex;
    }

    public detachComponents<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T
    ): ComponentInstancesFromQuery<T> {
        const archetypeIndex = this.entityToArchetypeIndex[entity];

        assert(archetypeIndex !== undefined, 'Entity not registered');

        const archetype = this.archetypes[archetypeIndex];

        const componentsToDetach: any[] = new Array(componentTypes.length).fill(null);
        const componentsToMove = removeEntityFromArchetype(archetype, entity).filter((component) => {
            const typeIndex = componentTypes.indexOf(component.constructor);

            if (typeIndex > -1) {
                componentsToDetach[typeIndex] = component;
                return false;
            }

            return true;
        });

        const newArchetypeSignature = createSignature(componentsToMove.map((c) => c.constructor));
        const [newArchetype, newArchetypeIndex] = this.findOrCreateArchetype(newArchetypeSignature);

        addEntityToArchetype(newArchetype, entity, componentsToMove);

        this.entityToArchetypeIndex[entity] = newArchetypeIndex;

        return componentsToDetach as unknown as ComponentInstancesFromQuery<T>;
    }

    public registerQuery<
        TAll extends ComponentTypesQuery,
        TSome extends ComponentTypesQuery = [],
        TNone extends ComponentTypesQuery = []
    >(all: TAll, some?: TSome, none?: TNone): QueryRecord<TAll, TSome>[] {
        const queryAll = all.map((componentType: ComponentType) => componentType.id as number);
        const querySome = (some || []).map((componentType: ComponentType) => componentType.id as number);
        const queryNone = (none || []).map((componentType: ComponentType) => componentType.id as number);

        // check existing queries for match
        queriesCycle: for (const query of this.queries) {
            const currentAll = query.layout[0];
            const currentSome = query.layout[1];
            const currentNone = query.layout[2];

            // potential match
            if (
                queryAll.length === currentAll.length &&
                querySome.length === currentSome.length &&
                queryNone.length === currentNone.length
            ) {
                // compare required components
                let i = 0;
                for (const componentTypeId of currentAll) {
                    if (componentTypeId !== queryAll[i]) {
                        continue queriesCycle;
                    }
                    i++;
                }

                // compare optional components
                i = 0;
                for (const componentTypeId of currentSome) {
                    if (componentTypeId !== querySome[i]) {
                        continue queriesCycle;
                    }
                    i++;
                }
                // compare filter out components
                i = 0;
                for (const componentTypeId of currentNone) {
                    if (componentTypeId !== queryNone[i]) {
                        continue queriesCycle;
                    }
                    i++;
                }

                // match is found
                return query.records as QueryRecord<TAll, TSome>[];
            }
        }

        // populate the query records with all matching archetypes. future archetypes will be added via registerArchetype
        const result: QueryRecord<TAll, TSome>[] = [];

        this.queries.push({
            layout: [queryAll, querySome, queryNone],
            records: result as QueryRecord<ComponentTypesQuery, ComponentTypesQuery>[]
        });

        this.archetypes.forEach(({ signature, entities, componentsTable }) => {
            // match
            if (typeIdsMatchSignature(queryAll, signature) && !anyTypeIdsMatchSignature(queryNone, signature)) {
                result.push([
                    entities,
                    queryAll.map((componentTypeId) =>
                        componentsTable.get(componentTypeId)
                    ) as unknown as ComponentTypesArrayFromQuerySignature<TAll>,
                    querySome.map(
                        (componentTypeId) => componentsTable.get(componentTypeId) || []
                    ) as unknown as ComponentTypesArrayFromQuerySignature<TSome>
                ]);
            }
        });

        return result;
    }

    private registerArchetype(signature: Signature): [Archetype, number] {
        const archetype = createArchetype({ signature });
        const index = this.archetypes.push(archetype) - 1;

        const componentsTable = archetype.componentsTable;

        // add archetype to matching queries
        for (const query of this.queries) {
            const allTypes = query.layout[0];
            const someTypes = query.layout[1];
            const noTypes = query.layout[2];

            if (typeIdsMatchSignature(allTypes, signature) && !anyTypeIdsMatchSignature(noTypes, signature)) {
                query.records.push([
                    archetype.entities,
                    allTypes.map((componentTypeId) => componentsTable.get(componentTypeId) || []),
                    someTypes.map((componentTypeId) => componentsTable.get(componentTypeId) || [])
                ]);
            }
        }

        return [archetype, index];
    }

    private findOrCreateArchetype(signature: Signature): [Archetype, number] {
        const archetypes = this.archetypes;
        const archetypesCount = archetypes.length;
        let archetypeIndex;

        for (archetypeIndex = 0; archetypeIndex < archetypesCount; archetypeIndex++) {
            const archetype = archetypes[archetypeIndex];
            if (signaturesMatch(signature, archetype.signature)) {
                return [archetype, archetypeIndex];
            }
        }

        return this.registerArchetype(signature);
    }
}
