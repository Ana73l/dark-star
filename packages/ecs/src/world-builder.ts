import {
    ContainerBuilder,
    ClassType,
    InjectableIdentifier,
    Factory,
    DSContainerBuilder,
    Instance,
    Abstract
} from '@dark-star/di';
import { World, ECSWorld } from './world';
import { SystemType } from './system';
import { Module } from './module';
import {} from './topic';

export class WorldBuilder {
    private systems: SystemType[] = [];
    private topics: Abstract<unknown>[] = [];

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

    public registerTopic<T extends Abstract<unknown>>(topic: T): WorldBuilder {
        this.topics.push(topic);

        return this;
    }

    public registerModule({ systems = [], topics = [], singletons = [], transients = [] }: Module): WorldBuilder {
        for (const system of systems) {
            this.registerSystem(system);
        }
        for (const singleton of singletons) {
            if (Array.isArray(singleton)) {
                this.registerSingleton(singleton[0], singleton[1]);
            } else {
                this.registerSingleton(singleton);
            }
        }
        for (const transient of transients) {
            if (Array.isArray(transient)) {
                this.registerTransient(transient[0], transient[1]);
            } else {
                this.registerTransient(transient);
            }
        }
        for (const topic of topics) {
            this.registerTopic(topic);
        }

        return this;
    }

    public build = async (): Promise<World> =>
        ECSWorld.compile({
            systems: this.systems,
            containerBuilder: this.injectablesBuilder,
            topics: this.topics
        });
}
