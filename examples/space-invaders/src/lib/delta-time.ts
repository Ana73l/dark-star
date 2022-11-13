import { injectable } from '@dark-star/di';
import { float64, serializable } from '@dark-star/shared-object';

@injectable()
@serializable()
export class DeltaTime {
    @float64()
    value: number = 0;
}