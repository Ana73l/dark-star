import { Abstract, ClassType, Factory, Instance } from '@dark-star/di';
import { System } from './system';

export type SingletonProviderSignature<T extends object = object> = [
    identifier: Abstract<T> | ClassType<T>,
    provider: ClassType<T> | Instance<T> | Factory<T>
];
export type TransientProviderSignature<T extends object = object> = [
    identifier: Abstract<T> | ClassType<T>,
    provider: ClassType<T> | Factory<T>
];

export type Module = {
    systems?: ClassType<System>[];
    singletons?: (ClassType | SingletonProviderSignature)[];
    transients?: (ClassType | TransientProviderSignature)[];
    topics?: Abstract<unknown>[];
};
