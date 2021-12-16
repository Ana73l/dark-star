import { Entity } from './entity';
import { ComponentInstancesFromQuery, ComponentTypesQuery } from './component';

enum WorldOpType {
    Create,
    Attach,
    Detach,
    Destroy
}

type CreateWorldOp<T extends ComponentTypesQuery> = [
    WorldOpType.Create,
    number | T,
    T | { (entity: Entity, components: ComponentInstancesFromQuery<T>): void },
    { (entity: Entity, components: ComponentInstancesFromQuery<T>): void } | undefined
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
