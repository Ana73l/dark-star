import {
    ContainerBuilder,
    ClassType,
    InjectableIdentifier,
    Factory,
    DSContainerBuilder,
    Instance
} from '@dark-star/di';
import { SystemType } from './system';
import { World, ECSWorld } from './world';

export class WorldBuilder {
    private systems: SystemType[] = [];

    constructor(private injectablesBuilder: ContainerBuilder = new DSContainerBuilder()) {}

    public registerTransient<T>(
        identifier: InjectableIdentifier<T>,
        constructor?: ClassType<T> | Factory<T>
    ): WorldBuilder {
        this.injectablesBuilder.registerTransient(identifier, constructor as any);

        return this;
    }

    public registerSingleton<T>(
        identifier: InjectableIdentifier<T>,
        constructor?: ClassType<T> | Factory<T> | Instance<T>
    ): WorldBuilder {
        this.injectablesBuilder.registerSingleton(identifier, constructor);

        return this;
    }

    public registerSystem<T extends SystemType>(constructor: T): WorldBuilder {
        this.injectablesBuilder.registerSingleton(constructor);
        this.systems.push(constructor);

        return this;
    }

    public build = async (): Promise<World> =>
        ECSWorld.compile({
            systems: this.systems,
            containerBuilder: this.injectablesBuilder
        });
}
