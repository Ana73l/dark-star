import { createWorkerSchemaScope } from './serialization/index';
import { workerWorldScript } from '../worker-world';

export const createWorkerGlobalScope = (): string => `
    ${createWorkerSchemaScope()}

    ${workerWorldScript}
`;
