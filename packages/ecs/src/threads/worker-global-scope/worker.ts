import { main } from '@dark-star/worker-pool';

import { WorkerWorld } from './worker-world';

// @ts-ignore
self.world = new WorkerWorld();

main();
