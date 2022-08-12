import { ComponentType } from '../component';
import { ComponentTypesQuery } from '../query';
import { SystemType, SystemGroup } from './system';

export const group =
    (grp: SystemType<SystemGroup>) =>
    <T extends SystemType>(target: T): T => {
        target.updateInGroup = grp;

        return target;
    };

export const updateBefore =
    (systemType: SystemType) =>
    <T extends SystemType>(target: T): T => {
        target.updateBefore = systemType;

        return target;
    };

export const updateAfter =
    (systemType: SystemType) =>
    <T extends SystemType>(target: T): T => {
        target.updateAfter = systemType;

        return target;
    };

export const entities =
    (...query: [all: ComponentTypesQuery, some?: ComponentTypesQuery, none?: ComponentType[]]) =>
    <T extends SystemType>(target: T, property: string): void => {
        const queryFields = (target.queryFields = target.queryFields || {});

        queryFields[property] = query;
    };
