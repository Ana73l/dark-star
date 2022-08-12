import { InArray } from '@dark-star/core';

import { ComponentType, ComponentTypeId } from './component';
import { Archetype } from './storage/archetype/archetype';

export enum ComponentAccessFlags {
  Read,
  Write,
}

export type ReadComponentAccess<T extends ComponentType = ComponentType> = {
  type: T;
  flag: ComponentAccessFlags.Read;
};
export type WriteComponentAccess<T extends ComponentType = ComponentType> = {
  type: T;
  flag: ComponentAccessFlags.Write;
};

export type ComponentQueryDescriptor<T extends ComponentType = ComponentType> =
  | ReadComponentAccess<T>
  | WriteComponentAccess<T>;

export type ComponentTypesQuery =
  | [ComponentQueryDescriptor | ComponentType]
  | (ComponentQueryDescriptor | ComponentType)[];

export type ComponentInstancesFromTypes<T> = {
  [P in keyof T]: T[P] extends ComponentType<infer U> ? U : never;
};

export type OptionalComponentInstancesFromTypes<T> = {
  [P in keyof T]: T[P] extends ComponentType<infer U> ? U | undefined : never;
};

export type OptionalComponentPartialsFromTypes<T> = {
  [P in keyof T]: T[P] extends ComponentType
    ? InstanceType<T[P]> | undefined
    : never;
};

export type ComponentTypesFromQuery<T> = {
  [P in keyof T]: T[P] extends ComponentType
    ? T[P]
    : T[P] extends ComponentQueryDescriptor<infer U>
    ? U
    : never;
};

export type ComponentInstanceFromQuery<
  TComponent extends ComponentType,
  TAll extends ComponentTypesQuery,
  TSome extends ComponentTypesQuery = [],
  TNone extends ComponentType[] = []
> = InArray<TComponent, TNone> extends true
  ? never
  : InArray<TComponent, TAll> extends true
  ? InstanceType<TComponent>
  : InArray<TComponent, TSome> extends true
  ? InstanceType<TComponent> | undefined
  : never;

export type ComponentInstancesFromQuery<
  TDescriptors extends ComponentTypesQuery,
  TAll extends ComponentType[],
  TSome extends ComponentType[] = [],
  TNone extends ComponentType[] = []
> = {
  [P in keyof TDescriptors]: TDescriptors[P] extends ComponentQueryDescriptor<
    infer U
  >
    ? InArray<U, TNone> extends true
      ? [never, 'Value not registered in query', U]
      : InArray<U, TAll> extends true
      ? TDescriptors[P] extends WriteComponentAccess
        ? InstanceType<U>
        : Readonly<InstanceType<U>>
      : InArray<U, TSome> extends true
      ? TDescriptors[P] extends WriteComponentAccess
        ? InstanceType<U> | undefined
        : Readonly<InstanceType<U>> | undefined
      : [never, 'Value not registered in query', U]
    : TDescriptors[P] extends ComponentType
    ? InArray<TDescriptors[P], TNone> extends true
      ? [never, 'Value not registered in query', TDescriptors[P]]
      : InArray<TDescriptors[P], TAll> extends true
      ? InstanceType<TDescriptors[P]>
      : InArray<TDescriptors[P], TSome> extends true
      ? InstanceType<TDescriptors[P]> | undefined
      : [never, 'Value not registered in query', TDescriptors[P]]
    : never;
};

export type QueryRecordLayout = [
  all: Int32Array,
  some: Int32Array,
  none?: ComponentTypeId[]
];

export type QueryRecord<
  TAll extends ComponentTypesQuery,
  TSome extends ComponentTypesQuery = [],
  TNone extends ComponentTypesQuery = []
> = [layout: QueryRecordLayout, archetypes: Archetype[]];

export const read = <T extends ComponentType>(
  componentType: T
): ComponentQueryDescriptor<T> => ({
  type: componentType,
  flag: ComponentAccessFlags.Read,
});

export const write = <T extends ComponentType>(
  componentType: T
): ComponentQueryDescriptor<T> => ({
  type: componentType,
  flag: ComponentAccessFlags.Write,
});

export const convertQueryToDescriptors = <T extends ComponentTypesQuery>(
  query: T
): ComponentQueryDescriptor[] =>
  query.map((descriptor: any) =>
    typeof descriptor === 'function'
      ? { type: descriptor, flag: ComponentAccessFlags.Write }
      : descriptor
  );

export const convertDescriptorsToQuery = <T extends ComponentTypesQuery>(
  query: T
): ComponentTypesFromQuery<T> =>
  query.map((descriptor: any) =>
    typeof descriptor === 'function' ? descriptor : descriptor.type
  ) as ComponentTypesFromQuery<T>;

// export const createQueryResult = <
//     TAll extends ComponentTypesQuery = ComponentTypesQuery,
//     TSome extends ComponentTypesQuery = []
// >(
//     records: QueryRecord<TAll, TSome>[],
//     layout: [ComponentTypeId[], ComponentTypeId[]]
// ): QueryResult<TAll, TSome> => {
//     const allTypeIds = layout[0];
//     const someTypeIds = layout[1];

//     const allTypesCount = allTypeIds.length;
//     const someTypesCount = someTypeIds.length;

//     const each = (
//         iteratee: (
//             entity: Entity,
//             all: ComponentInstancesFromQuery<TAll>,
//             some?: ComponentInstancesFromQuery<TSome>
//         ) => void
//     ): void => {
//         let recordIndex;
//         let entities;
//         let entityIndex;
//         const mandatoryComponents = new Array(allTypeIds.length).fill(null);
//         const optionalComponents = new Array(someTypeIds.length).fill(null);
//         let componentIndex;

//         for (recordIndex = 0; recordIndex < records.length; recordIndex++) {
//             entities = records[recordIndex][0];

//             for (entityIndex = 0; entityIndex < entities.length; entityIndex++) {
//                 // proxy for mandatory components
//                 for (componentIndex = 0; componentIndex < allTypesCount; componentIndex++) {
//                     mandatoryComponents[componentIndex] = records[recordIndex][1][componentIndex][entityIndex];
//                 }
//                 // proxy for optional components
//                 for (componentIndex = 0; componentIndex < someTypesCount; componentIndex++) {
//                     optionalComponents[componentIndex] = records[recordIndex][1][componentIndex][entityIndex];
//                 }

//                 iteratee(
//                     records[recordIndex][0][entityIndex],
//                     mandatoryComponents as unknown as ComponentInstancesFromQuery<TAll>,
//                     optionalComponents as unknown as ComponentInstancesFromQuery<TSome>
//                 );
//             }
//         }
//     };

//     return {
//         each,
//         [Symbol.iterator]() {
//             return records[Symbol.iterator]();
//         }
//     };
// };
