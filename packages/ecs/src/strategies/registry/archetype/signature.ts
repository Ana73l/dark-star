import { ComponentTypeId, ComponentTypesQuery } from '../../../component';

export type Signature = Set<ComponentTypeId>;

export const createSignature = <T extends ComponentTypesQuery>(componentTypes: T): Signature => {
    const componentTypesLength = componentTypes.length;
    const componentTypeIds = Array(componentTypesLength).fill(null);

    let i;

    for (i = 0; i < componentTypesLength; i++) {
        componentTypeIds[i] = componentTypes[i].id;
    }

    return new Set(componentTypeIds);
};

export const signatureIsSubset = (subset: Signature, superset: Signature): boolean => {
    if (subset.size > superset.size) {
        return false;
    }

    for (const componentType of subset) {
        if (!superset.has(componentType)) {
            return false;
        }
    }

    return true;
};

export const signaturesMatch = (a: Signature, b: Signature): boolean => {
    if (a.size !== b.size) {
        return false;
    }

    for (const componentType of a) {
        if (!b.has(componentType)) {
            return false;
        }
    }

    return true;
};

export const typesMatchSignature = (componentTypeIds: ComponentTypesQuery, signature: Signature): boolean => {
    for (const componentType of componentTypeIds) {
        if (!signature.has(componentType.id as number)) {
            return false;
        }
    }

    return true;
};

export const anyTypesMatchSignature = (componentTypes: ComponentTypesQuery, signature: Signature): boolean => {
    for (const componentType of componentTypes) {
        if (signature.has(componentType.id as number)) {
            return true;
        }
    }

    return false;
};

export const typeIdsMatchSignature = (componentTypeIds: ComponentTypeId[], signature: Signature): boolean => {
    for (const componentTypeId of componentTypeIds) {
        if (!signature.has(componentTypeId)) {
            return false;
        }
    }

    return true;
};

export const anyTypeIdsMatchSignature = (componentTypeIds: ComponentTypeId[], signature: Signature): boolean => {
    for (const componentTypeId of componentTypeIds) {
        if (signature.has(componentTypeId)) {
            return true;
        }
    }

    return false;
};
