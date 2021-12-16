import { createUIDGenerator } from './utils/misc';

const uid = createUIDGenerator(1);

export type ComponentTypeId = number;
export type ComponentType<T = any> = { new (): T; readonly id?: ComponentTypeId };
export type ComponentTypesQuery = [ComponentType] | ComponentType[];

export type ComponentInstancesFromQuery<T> = {
    [P in keyof T]: T[P] extends ComponentType ? InstanceType<T[P]> : never;
};
export type OptionalComponentInstancesFromQuery<T> = {
    [P in keyof T]: T[P] extends ComponentType ? InstanceType<T[P]> | undefined : never;
};
export type ComponentTypesArrayFromQuerySignature<T> = {
    [P in keyof T]: T[P] extends ComponentType ? InstanceType<T[P]>[] : never;
};
export type OptionalTypesArrayFromQuerySignature<T> = {
    [P in keyof T]: T[P] extends ComponentType ? (InstanceType<T[P]> | undefined)[] : never;
};

export const component = <T extends ComponentType>(target: T): T =>
    Object.defineProperty(target, 'id', {
        configurable: false,
        value: uid()
    });
