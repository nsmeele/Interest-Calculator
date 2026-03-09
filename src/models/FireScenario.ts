import type { ScenarioType } from './ScenarioType';

export interface FireScenario {
  retirementAge: number;
  yearsToSave: number;
  requiredNestEgg: number;
  projectedNestEgg: number;
  monthlySavingsNeeded: number;
  savingsContribution: number;
  returnsContribution: number;
  isFeasible: boolean;
  isAlreadyFire: boolean;
  shortfall: number;
  scenarioType: ScenarioType;
}
