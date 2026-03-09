import type { IFireCalculator } from '../interfaces/IFireCalculator';
import type { FireInput } from '../models/FireInput';
import type { FireScenario } from '../models/FireScenario';

export const FIRE_RETIREMENT_AGES = [40, 45, 50, 55, 60, 65, 70] as const;

export const FIRE_DEFAULT_RETURN_RATE = 7;
export const FIRE_DEFAULT_INFLATION_RATE = 2;
export const FIRE_DEFAULT_SWR = 4;

export class FireCalculator implements IFireCalculator {
  calculateAll(input: FireInput): FireScenario[] {
    return FIRE_RETIREMENT_AGES
      .filter((age) => age > input.currentAge)
      .map((age) => this.buildScenario(input, age));
  }

  private buildScenario(input: FireInput, retirementAge: number): FireScenario {
    const yearsToSave = input.yearsToRetirement(retirementAge);
    const monthlyContribution = Math.max(0, input.monthlySavingsCapacity);
    const requiredNestEgg = this.calculateRequiredNestEgg(input, yearsToSave);
    const projectedNestEgg = this.calculateProjectedNestEgg(
      input.currentSavings, monthlyContribution, input.expectedReturnRate, yearsToSave,
    );
    const monthlySavingsNeeded = this.calculateMonthlySavingsNeeded(
      requiredNestEgg, input.currentSavings, input.expectedReturnRate, yearsToSave,
    );
    const totalDeposited = monthlyContribution * yearsToSave * 12 + input.currentSavings;
    const savingsContribution = Math.min(totalDeposited, projectedNestEgg);
    const returnsContribution = Math.max(0, projectedNestEgg - totalDeposited);

    const fvCurrentSavings = this.calculateFutureValue(input.currentSavings, input.expectedReturnRate, yearsToSave);
    const isAlreadyFire = fvCurrentSavings >= requiredNestEgg;
    const isFeasible = isAlreadyFire || monthlySavingsNeeded <= monthlyContribution;
    const shortfall = Math.max(0, requiredNestEgg - projectedNestEgg);

    return {
      retirementAge,
      yearsToSave,
      requiredNestEgg,
      projectedNestEgg,
      monthlySavingsNeeded: isAlreadyFire ? 0 : monthlySavingsNeeded,
      savingsContribution,
      returnsContribution,
      isFeasible,
      isAlreadyFire,
      shortfall,
    };
  }

  private calculateRequiredNestEgg(input: FireInput, yearsToSave: number): number {
    const inflationMultiplier = Math.pow(1 + input.inflationRate / 100, yearsToSave);
    const futureAnnualExpenses = input.annualExpenses * inflationMultiplier;
    return futureAnnualExpenses / (input.safeWithdrawalRate / 100);
  }

  private calculateProjectedNestEgg(
    currentSavings: number, monthlyContribution: number,
    annualReturnRate: number, yearsToSave: number,
  ): number {
    const monthlyRate = this.getMonthlyRate(annualReturnRate);
    const months = yearsToSave * 12;

    if (monthlyRate === 0) {
      return currentSavings + monthlyContribution * months;
    }

    const fvSavings = currentSavings * Math.pow(1 + monthlyRate, months);
    const fvContributions = monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

    return fvSavings + fvContributions;
  }

  private calculateFutureValue(presentValue: number, annualReturnRate: number, years: number): number {
    const monthlyRate = this.getMonthlyRate(annualReturnRate);
    if (monthlyRate === 0) return presentValue;
    return presentValue * Math.pow(1 + monthlyRate, years * 12);
  }

  private calculateMonthlySavingsNeeded(
    requiredNestEgg: number, currentSavings: number,
    annualReturnRate: number, yearsToSave: number,
  ): number {
    const monthlyRate = this.getMonthlyRate(annualReturnRate);
    const months = yearsToSave * 12;

    if (monthlyRate === 0) {
      return Math.max(0, (requiredNestEgg - currentSavings) / months);
    }

    const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, months);
    const gap = requiredNestEgg - fvCurrentSavings;

    if (gap <= 0) return 0;

    return gap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }

  private getMonthlyRate(annualRate: number): number {
    return annualRate / 100 / 12;
  }
}
