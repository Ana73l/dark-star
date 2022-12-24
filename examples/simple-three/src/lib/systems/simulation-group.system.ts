import { SystemGroup, updateAfter } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { InputGroup } from './input-group.system';

@injectable()
@updateAfter(InputGroup)
export class SimulationGroup extends SystemGroup {}
