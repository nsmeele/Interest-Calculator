import type { FireScenario } from './FireScenario';

export interface FireAgeGroup {
  retirementAge: number;
  base: FireScenario;
  pessimistic: FireScenario;
  optimistic: FireScenario;
}
