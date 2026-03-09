import type { FireInput } from '../models/FireInput';
import type { FireScenario } from '../models/FireScenario';

export interface IFireCalculator {
  calculateAll(input: FireInput): FireScenario[];
}
