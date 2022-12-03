import { Entity } from '../entity';
import { ComponentType } from '../component';
import { ComponentAccessFlags, QueryRecord } from '../query';

export class ComponentLookup<T extends ComponentType, R extends boolean = false> {
    private flag: ComponentAccessFlags;

    constructor(private type: T, private record: QueryRecord, readonly?: R) {
        this.flag = readonly ? ComponentAccessFlags.Read : ComponentAccessFlags.Write;
    }

    [e: Entity]: R extends true ? Readonly<InstanceType<T>> : InstanceType<T>;
}