import { Abstract, ClassType, ContainerBuilder, Instance } from '@dark-star/di';
import { Nullable } from './types';
import { Entity } from './entity';
import { createUIDGenerator, assert } from './utils/misc';
import { Registry } from './strategies/registry/registry';
import { ArchetypeArray } from './strategies/registry/archetype/array/archetype-array';
import { ComponentsPool } from './strategies/pooling/componentsPool';
import { NullPull } from './strategies/pooling/nullPool';
import {
    ComponentType,
    ComponentTypesQuery,
    ComponentInstancesFromQuery,
    OptionalComponentInstancesFromQuery
} from './component';
import { QueryResult, createQueryResult } from './query';
import { System, SystemType, executeSystems } from './system';
import { Topic } from './topic';

enum WorldOpType {
    Create,
    CreateMultiple,
    Attach,
    Detach,
    Destroy
}

type CreateWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.Create,
    T,
    { (entity: Entity, components: ComponentInstancesFromQuery<T>): void } | undefined
];

type CreateMultipleWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.CreateMultiple,
    number,
    T,
    { (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number): void } | undefined
];

type AttachWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.Attach,
    Entity,
    T,
    (components: ComponentInstancesFromQuery<T>) => void
];
type DetachWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.Detach,
    Entity,
    T,
    (components: ComponentInstancesFromQuery<T>) => void
];
type DestroyWorldOp<T extends ComponentTypesQuery = []> = [
    WorldOpType.Destroy,
    Entity,
    T,
    (components: OptionalComponentInstancesFromQuery<T>) => void
];
type WorldOp<T extends ComponentTypesQuery> =
    | CreateWorldOp<T>
    | CreateMultipleWorldOp<T>
    | AttachWorldOp<T>
    | DetachWorldOp<T>
    | DestroyWorldOp<T>;

export type WorldCompileParams = {
    registryStrategy?: Registry | ClassType<Registry>;
    componentPoolingStrategy?: ComponentsPool | ClassType<ComponentsPool>;
    ueid?: () => number | null;
    containerBuilder: ContainerBuilder;
    systems: SystemType[];
    topics: Abstract<unknown>[];
};

export abstract class World {
    abstract spawn<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract spawn<T extends ComponentTypesQuery>(
        entitiesCount: number,
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number) => void
    ): void;

    abstract spawnImmediate<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract spawnImmediate<T extends ComponentTypesQuery>(
        entitiesCount: number,
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number) => void
    ): void;

    abstract exists(entity: Entity): boolean;

    abstract has<T extends ComponentType>(entity: Entity, componentType: T): boolean;

    abstract get<T extends ComponentType>(entity: Entity, componentType: T): Nullable<InstanceType<T>>;

    abstract attach<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        initializer?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract attachImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        initializer?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract detach<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract detachImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract destroy<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes?: T,
        reset?: (components: OptionalComponentInstancesFromQuery<T>) => void
    ): void;

    abstract destroyImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes?: T,
        reset?: (components: OptionalComponentInstancesFromQuery<T>) => void
    ): void;

    abstract query<
        TAll extends ComponentTypesQuery,
        TSome extends ComponentTypesQuery = [],
        TNone extends ComponentTypesQuery = []
    >(all: TAll, some?: TSome, none?: TNone): QueryResult<TAll, TSome>;

    abstract getTopic<T extends object>(topic: Abstract<T>): Topic<Instance<T>>;

    abstract step(deltaT: number): void;
}

export class ECSWorld implements World {
    private registry!: Registry;
    private componentsPool!: ComponentsPool;
    private operationsQueue: WorldOp<ComponentTypesQuery>[] = [];
    private systems: System[] = [];
    private topics: Map<Abstract<unknown>, Topic<unknown>> = new Map();
    private reusableEntities: Entity[] = [];
    private ueid!: () => number | null;

    private constructor() {}

    public static async compile({
        ueid = createUIDGenerator(1),
        containerBuilder,
        systems,
        topics,
        registryStrategy = ArchetypeArray,
        componentPoolingStrategy = NullPull
    }: WorldCompileParams): Promise<World> {
        return new Promise((resolve) => {
            const world = new ECSWorld();
            world.ueid = ueid;

            if (typeof registryStrategy === 'function') {
                world.registry = new registryStrategy();
            } else {
                world.registry = registryStrategy;
            }

            if (typeof componentPoolingStrategy === 'function') {
                world.componentsPool = new componentPoolingStrategy();
            } else {
                world.componentsPool = componentPoolingStrategy;
            }

            containerBuilder.registerSingleton(World, world);

            const injectablesContainer = containerBuilder.build();

            // create topics
            for (const topic of topics) {
                world.topics.set(topic, new Topic<Instance<typeof topic>>());
            }

            // init systems
            world.systems = systems.map((systemType) => injectablesContainer.get(systemType));

            resolve(world);
        });
    }

    public spawn<T extends ComponentTypesQuery>(
        entitiesCount: number | T,
        componentTypes?: T | { (entity: Entity, components: ComponentInstancesFromQuery<T>): void },
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number) => void
    ): void {
        if (typeof entitiesCount === 'number') {
            this.operationsQueue.push([
                WorldOpType.CreateMultiple,
                entitiesCount,
                componentTypes as T,
                // @ts-ignore
                initializer
            ]);
        } else {
            this.operationsQueue.push([
                WorldOpType.Create,
                entitiesCount as T,
                // @ts-ignore
                componentTypes
            ]);
        }
    }

    public spawnImmediate<T extends ComponentTypesQuery>(
        entitiesCount: number | T,
        componentTypes?: T | { (entity: Entity, components: ComponentInstancesFromQuery<T>): void },
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number) => void
    ): void {
        if (typeof entitiesCount === 'number') {
            // spawn multiple
            this.spawnMultiple(entitiesCount as number, componentTypes as T, initializer);
        } else {
            // spawn single
            this.spawnSingle(
                entitiesCount as T,
                componentTypes as undefined | { (entity: Entity, components: ComponentInstancesFromQuery<T>): void }
            );
        }
    }

    public exists(entity: number): boolean {
        return this.registry.exists(entity);
    }

    public has<T extends ComponentType<any>>(entity: number, componentType: T): boolean {
        return this.registry.hasComponent(entity, componentType);
    }

    public get<T extends ComponentType>(entity: Entity, componentType: T): Nullable<InstanceType<T>> {
        return this.registry.getComponent(entity, componentType);
    }

    public attach<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        initializer?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        this.operationsQueue.push([
            WorldOpType.Attach,
            entity,
            componentTypes,
            // @ts-ignore
            initializer as (components: ComponentInstancesFromQuery<T>) => void
        ]);
    }

    public attachImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        initializer?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        assert(this.registry.hasAnyComponent(entity, componentTypes) === false, 'Component already attached');

        const newComponents = new Array(componentTypes.length).fill(null);
        let i = 0;

        for (const componentType of componentTypes) {
            newComponents[i] = this.componentsPool.get(componentType) || new componentType();
            i++;
        }

        initializer && initializer(newComponents as unknown as ComponentInstancesFromQuery<T>);

        this.registry.attachComponents(entity, newComponents);
    }

    public detach<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        this.operationsQueue.push([
            WorldOpType.Detach,
            entity,
            componentTypes,
            // @ts-ignore
            reset as (components: ComponentInstancesFromQuery<T>) => void
        ]);
    }

    public detachImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        assert(this.registry.hasAllComponents(entity, componentTypes) === true, 'Component not registered to entity');

        const comps = this.registry.detachComponents(entity, componentTypes);

        reset && reset(comps);
    }

    public destroy<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes?: T,
        reset?: (components: OptionalComponentInstancesFromQuery<T>) => void
    ): void {
        if (!this.registry.exists(entity)) {
            return;
        }

        this.operationsQueue.push([
            WorldOpType.Destroy,
            entity,
            componentTypes,
            // @ts-ignore
            reset as (components: OptionalComponentInstancesFromQuery<T>) => void
        ]);
    }

    public destroyImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes?: T,
        reset?: (components: OptionalComponentInstancesFromQuery<T>) => void
    ): void {
        if (!this.registry.exists(entity)) {
            return;
        }

        const components = this.registry.unregisterEntity(entity);
        this.reusableEntities.push(entity);

        const componentsToReset = componentTypes?.map((componentType) =>
            components.find((component: InstanceType<ComponentType>) => component.constructor === componentType)
        );

        reset && reset(componentsToReset as OptionalComponentInstancesFromQuery<T>);
    }

    public query<
        TAll extends ComponentTypesQuery,
        TSome extends ComponentTypesQuery = [],
        TNone extends ComponentTypesQuery = []
    >(all: TAll, some?: TSome, none?: TNone): QueryResult<TAll, TSome> {
        const records = this.registry.registerQuery(all, some || [], none || []);
        const typesAll = all.map((componentType) => componentType.id as number);
        const typesSome = all.map((componentType) => componentType.id as number);

        return createQueryResult(records, [typesAll, typesSome]) as QueryResult<TAll, TSome>;
    }

    public getTopic<T extends object>(topic: Abstract<T>): Topic<Instance<T>> {
        assert(this.topics.has(topic), 'Topic not registered');
        return this.topics.get(topic) as Topic<Instance<T>>;
    }

    public step(deltaT: number): ECSWorld {
        // apply enqueued operations
        const operations = this.operationsQueue;
        const operationsLength = operations.length;
        let currentOperationIndex;
        for (currentOperationIndex = 0; currentOperationIndex < operationsLength; currentOperationIndex++) {
            const currentOperation = operations[currentOperationIndex];

            switch (currentOperation[0]) {
                case WorldOpType.Create:
                    this.spawnImmediate(currentOperation[1], currentOperation[2]);
                    break;
                case WorldOpType.CreateMultiple:
                    this.spawnImmediate(currentOperation[1], currentOperation[2], currentOperation[3]);
                    break;
                case WorldOpType.Attach:
                    this.attachImmediate(currentOperation[1], currentOperation[2], currentOperation[3]);
                    break;
                case WorldOpType.Detach:
                    this.detachImmediate(currentOperation[1], currentOperation[2], currentOperation[3]);
                    break;
                case WorldOpType.Destroy:
                    this.destroyImmediate(currentOperation[1], currentOperation[2], currentOperation[3]);
                    break;
            }
        }
        // empty operations queue
        while (operations.length > 0) {
            operations.pop();
        }

        // flush topics
        for (const [, topic] of this.topics) {
            topic.flush();
        }

        // execute systems
        executeSystems(this.systems, deltaT);

        return this;
    }

    private spawnSingle<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void {
        const entity = this.reusableEntities.pop() || this.ueid();

        assert(entity !== null, 'Maximum entities reached.');

        const components = new Array(componentTypes.length).fill(null);
        let i = 0;

        for (const componentType of componentTypes) {
            components[i] = this.componentsPool.get(componentType) || new componentType();
            i++;
        }

        this.registry.registerEntity(entity, components);

        initializer && initializer(entity, components as unknown as ComponentInstancesFromQuery<T>);
    }

    private spawnMultiple<T extends ComponentTypesQuery>(
        count: number,
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>, iteration: number) => void
    ): void {
        if (count === 0) {
            return;
        }

        const entities = new Array(count).fill(null);
        const components = new Array(count).fill(null);

        let i = 0;
        for (i = 0; i < count; i++) {
            const entity = this.reusableEntities.pop() || this.ueid();

            assert(entity !== null, 'Maximum entities reached');

            const entityComponents = new Array(componentTypes.length).fill(null);
            let componentIndex = 0;

            for (const componentType of componentTypes as T) {
                entityComponents[componentIndex] = this.componentsPool.get(componentType) || new componentType();
                componentIndex++;
            }

            entities[i] = entity;
            components[i] = entityComponents;
        }

        this.registry.registerEntities(entities, components);

        if (typeof initializer === 'function') {
            let entityIndex;
            for (entityIndex = 0; entityIndex < count; entityIndex++) {
                initializer(entities[entityIndex], components[entityIndex], entityIndex);
            }
        }
    }
}
