// tslint:disable-next-line: variable-name
export const shared_object_1 = `{
    createSharedObjectArray: (
        schemaType,
        buffer,
        { offset = 0, length = 1 } = {}
    ) => {
        const schemaSize = schemaType[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$size];
        if (!buffer) {
            buffer = new SharedArrayBuffer(schemaSize * length);
            offset = 0;
        }
        const view = new DataView(buffer, offset);
        let stride = 0;
    
        const array = new Array(length);
        let i;
    
        for (i = 0; i < length; i++) {
            const schemaInstance = new schemaType();
            schemaInstance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$view] = view;
            schemaInstance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$offset] = stride;
    
            array[i] = schemaInstance;

            if(schemaType.name === 'Movement') {
                throw JSON.stringify(schemaInstance);
            }
            stride += schemaSize;
        }
    
        return Object.freeze(
            Object.assign(array, {
                [_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$view]: view,
                [_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$offset]: offset
            })
        );
    },
    createSharedObject: (
        schemaType,
        buffer,
        offset = 0
    ) => {
        if (!buffer) {
            buffer = new SharedArrayBuffer(schemaType[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$size]);
            offset = 0;
        }
    
        const schemaInstance = new schemaType();
        schemaInstance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$view] = new DataView(buffer, offset);
        schemaInstance[_dark_star_core__WEBPACK_IMPORTED_MODULE_16__.$offset] = offset;

        return schemaInstance;
    }
}`;
