import { ComponentType } from '../../component';

export interface ComponentsPool {
    get<T extends ComponentType>(componentType: T): InstanceType<T> | undefined;
    set<T extends ComponentType>(component: InstanceType<T>): void;
}
