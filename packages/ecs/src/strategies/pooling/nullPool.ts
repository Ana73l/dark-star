import { ComponentType } from '../../component';
import { ComponentsPool } from './componentsPool';

export class NullPull implements ComponentsPool {
    constructor(private maxPoolSize: number = 100) {}

    get<T extends ComponentType>(): undefined {
        return;
    }

    set() {
        return;
    }
}
