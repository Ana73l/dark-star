import { Entity } from './entity';
import {
    ComponentTypeId,
    ComponentTypesQuery,
    ComponentInstancesFromQuery,
    ComponentTypesArrayFromQuerySignature,
    OptionalTypesArrayFromQuerySignature,
    OptionalComponentInstancesFromQuery
} from './component';

export type QueryRecord<TAll extends ComponentTypesQuery, TSome extends ComponentTypesQuery = []> = [
    Entity[],
    ComponentTypesArrayFromQuerySignature<TAll>,
    OptionalTypesArrayFromQuerySignature<TSome>
];

export type QueryResult<TAll extends ComponentTypesQuery, TSome extends ComponentTypesQuery = []> = {
    each: (
        iteratee: (
            entity: Entity,
            components: ComponentInstancesFromQuery<TAll>,
            optComponents?: OptionalComponentInstancesFromQuery<TSome>
        ) => void
    ) => void;
    [Symbol.iterator](): IterableIterator<QueryRecord<TAll, TSome>>;
};

export const createQueryResult = <
    TAll extends ComponentTypesQuery = ComponentTypesQuery,
    TSome extends ComponentTypesQuery = []
>(
    records: QueryRecord<TAll, TSome>[],
    layout: [ComponentTypeId[], ComponentTypeId[]]
): QueryResult<TAll, TSome> => {
    const allTypeIds = layout[0];
    const someTypeIds = layout[1];

    const allTypesCount = allTypeIds.length;
    const someTypesCount = someTypeIds.length;

    const each = (
        iteratee: (
            entity: Entity,
            all: ComponentInstancesFromQuery<TAll>,
            some?: ComponentInstancesFromQuery<TSome>
        ) => void
    ): void => {
        let recordIndex;
        let entities;
        let entityIndex;
        const mandatoryComponents = new Array(allTypeIds.length).fill(null);
        const optionalComponents = new Array(someTypeIds.length).fill(null);
        let componentIndex;

        for (recordIndex = 0; recordIndex < records.length; recordIndex++) {
            entities = records[recordIndex][0];

            for (entityIndex = 0; entityIndex < entities.length; entityIndex++) {
                // proxy for mandatory components
                for (componentIndex = 0; componentIndex < allTypesCount; componentIndex++) {
                    mandatoryComponents[componentIndex] = records[recordIndex][1][componentIndex][entityIndex];
                }
                // proxy for optional components
                for (componentIndex = 0; componentIndex < someTypesCount; componentIndex++) {
                    optionalComponents[componentIndex] = records[recordIndex][1][componentIndex][entityIndex];
                }

                iteratee(
                    records[recordIndex][0][entityIndex],
                    mandatoryComponents as unknown as ComponentInstancesFromQuery<TAll>,
                    optionalComponents as unknown as ComponentInstancesFromQuery<TSome>
                );
            }
        }
    };

    return {
        each,
        [Symbol.iterator]() {
            return records[Symbol.iterator]();
        }
    };
};
