import type { FireInput } from '../models/FireInput';
import type { FireAgeGroup } from '../models/FireAgeGroup';

export interface IFireCalculator {
  calculateAll(input: FireInput): FireAgeGroup[];
}
