import { ClassType, ContainerBuilder } from '@dark-star/di';
import { Nullable } from './types';
import { Entity } from './entity';
import { createUIDGenerator, assert } from './utils/misc';
import { Registry } from './strategies/registry/registry';
import { ArchetypeArray } from './strategies/registry/archetype/array/archetype-array';
import { ComponentsPool } from './strategies/pooling/componentsPool';
import { NullPull } from './strategies/pooling/nullPool';
import { ComponentType, ComponentTypesQuery, ComponentInstancesFromQuery } from './component';
import { QueryResult, createQueryResult } from './query';
import { System, SystemType, executeSystems } from './system';

enum WorldOpType {
    Create,
    Attach,
    Detach,
    Destroy
}

type CreateWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.Create,
    T,
    (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
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
    (components: ComponentInstancesFromQuery<T>) => void
];
type WorldOp<T extends ComponentTypesQuery> =
    | CreateWorldOp<T>
    | AttachWorldOp<T>
    | DetachWorldOp<T>
    | DestroyWorldOp<T>;

export type WorldCompileParams = {
    registryStrategy?: Registry | ClassType<Registry>;
    componentPoolingStrategy?: ComponentsPool | ClassType<ComponentsPool>;
    ueid?: () => number | null;
    containerBuilder: ContainerBuilder;
    systems: SystemType[];
};

export abstract class World {
    abstract spawn<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract spawnImmediate<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void;

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
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract destroyImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void;

    abstract query<
        TAll extends ComponentTypesQuery,
        TSome extends ComponentTypesQuery = [],
        TNone extends ComponentTypesQuery = []
    >(all: TAll, some?: TSome, none?: TNone): QueryResult<TAll, TSome>;

    abstract step(deltaT: number): void;
}

export class ECSWorld implements World {
    private registry!: Registry;
    private componentsPool!: ComponentsPool;
    private operationsQueue: WorldOp<ComponentTypesQuery>[] = [];
    private systems: System[] = [];
    private reusableEntities: Entity[] = [];
    private ueid!: () => number | null;

    private constructor() {}

    public static async compile({
        ueid = createUIDGenerator(1),
        containerBuilder,
        systems,
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

            world.systems = systems.map((systemType) => injectablesContainer.get(systemType));

            resolve(world);
        });
    }

    public spawn<T extends ComponentTypesQuery>(
        componentTypes: T,
        initializer?: (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
    ): void {
        this.operationsQueue.push([
            WorldOpType.Create,
            componentTypes,
            // @ts-ignore
            initializer as (entity: Entity, components: ComponentInstancesFromQuery<T>) => void
        ]);
    }

    public spawnImmediate<T extends ComponentTypesQuery>(
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
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        this.operationsQueue.push([
            WorldOpType.Destroy,
            entity,
            componentTypes,
            // @ts-ignore
            reset as (components: ComponentInstancesFromQuery<T>) => void
        ]);
    }

    public destroyImmediate<T extends ComponentTypesQuery>(
        entity: Entity,
        componentTypes: T,
        reset?: (components: ComponentInstancesFromQuery<T>) => void
    ): void {
        this.operationsQueue.push([
            WorldOpType.Destroy,
            entity,
            componentTypes,
            // @ts-ignore
            reset as (components: ComponentInstancesFromQuery<T>) => void
        ]);
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

        // execute systems
        executeSystems(this.systems, deltaT);

        return this;
    }
}
