// tslint:disable-next-line: variable-name
export const serialization_1 = `{
    createSharedObjectArray(
        schemaType,
        buffer,
        { offset = 0, length = 1 } = {}
    ) => {
        const schemaSize = schemaType[_internals_1.$size]!;
        if (!buffer) {
            buffer = new SharedArrayBuffer(schemaSize * length);
            offset = 0;
        }
        const view = new DataView(buffer, offset);
        let stride = 0;
    
        const array = new Array(length);
        let i;
    
        for (i = 0; i < length; i++) {
            const schemaInstance = _internals_1.assignViewToInstance(new schemaType(), view, stride);
    
            array[i] = schemaInstance;
    
            stride += schemaSize;
        }
    
        return Object.assign(Object.freeze(array), {
            [_internals_1.$view]: view,
            [_internals_1.$offset]: offset
        });
    },
    createSharedObject(
        schemaType: T,
        buffer?: ArrayBuffer,
        offset: number = 0
    ) => {
        if (!buffer) {
            buffer = new SharedArrayBuffer(schemaType[_internals_1.$size]!);
            offset = 0;
        }
    
        return _internals_1.assignViewToInstance(new schemaType(), new DataView(buffer, offset), offset);
    }
}`;
