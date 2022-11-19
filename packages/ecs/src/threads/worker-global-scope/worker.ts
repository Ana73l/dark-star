import { main } from '@dark-star/worker-pool';

import { WorkerWorld } from './worker-world';

const ctx: Worker & { world: WorkerWorld } = self as any;

ctx.world = new WorkerWorld();

main();
