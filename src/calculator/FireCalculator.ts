import type { IFireCalculator } from '../interfaces/IFireCalculator';
import { FireInput } from '../models/FireInput';
import type { FireScenario } from '../models/FireScenario';
import type { FireAgeGroup } from '../models/FireAgeGroup';
import { ScenarioType } from '../models/ScenarioType';

export const FIRE_RETIREMENT_AGES = [40, 45, 50, 55, 60, 65, 70] as const;

export const FIRE_DEFAULT_RETURN_RATE = 7;
export const FIRE_DEFAULT_INFLATION_RATE = 3;
export const FIRE_DEFAULT_SWR = 4;

/** Pessimistic: -20% crash on savings, return rate -2% */
const PESSIMISTIC_CRASH_FACTOR = 0.8;
const PESSIMISTIC_RETURN_DELTA = -2;

/** Optimistic: return rate +2%, inflation -1% */
const OPTIMISTIC_RETURN_DELTA = 2;
const OPTIMISTIC_INFLATION_DELTA = -1;

export class FireCalculator implements IFireCalculator {
  calculateAll(input: FireInput): FireAgeGroup[] {
    return FIRE_RETIREMENT_AGES
      .filter((age) => age > input.currentAge)
      .map((age) => this.buildScenarioGroup(input, age));
  }

  private buildScenarioGroup(input: FireInput, retirementAge: number): FireAgeGroup {
    const pessimisticInput = new FireInput(
      input.currentAge,
      input.currentSavings * PESSIMISTIC_CRASH_FACTOR,
      input.monthlyIncome,
      input.monthlyExpenses,
      Math.max(0, input.expectedReturnRate + PESSIMISTIC_RETURN_DELTA),
      input.inflationRate,
      input.safeWithdrawalRate,
      input.lifeExpectancy,
      input.aowAge,
      input.aowMonthlyAmount,
    );
    const optimisticInput = new FireInput(
      input.currentAge,
      input.currentSavings,
      input.monthlyIncome,
      input.monthlyExpenses,
      input.expectedReturnRate + OPTIMISTIC_RETURN_DELTA,
      Math.max(0, input.inflationRate + OPTIMISTIC_INFLATION_DELTA),
      input.safeWithdrawalRate,
      input.lifeExpectancy,
      input.aowAge,
      input.aowMonthlyAmount,
    );

    return {
      retirementAge,
      base: this.buildScenario(input, retirementAge, ScenarioType.BASE),
      pessimistic: this.buildScenario(pessimisticInput, retirementAge, ScenarioType.PESSIMISTIC),
      optimistic: this.buildScenario(optimisticInput, retirementAge, ScenarioType.OPTIMISTIC),
    };
  }

  private buildScenario(input: FireInput, retirementAge: number, scenarioType: ScenarioType): FireScenario {
    const yearsToSave = input.yearsToRetirement(retirementAge);
    const monthlyContribution = Math.max(0, input.monthlySavingsCapacity);
    const requiredNestEgg = this.calculateRequiredNestEgg(input, yearsToSave, retirementAge);
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
      scenarioType,
    };
  }

  /**
   * Calculate required nest egg accounting for AOW income after AOW age.
   * Two phases after retirement:
   * 1. Pre-AOW: full expenses from savings
   * 2. Post-AOW: expenses minus AOW from savings
   *
   * Uses PV of annuity formula for each phase, discounted at expected return rate.
   */
  private calculateRequiredNestEgg(input: FireInput, yearsToSave: number, retirementAge: number): number {
    const inflationRate = input.inflationRate / 100;
    const returnRate = input.expectedReturnRate / 100;
    const inflationAtRetirement = Math.pow(1 + inflationRate, yearsToSave);

    const futureAnnualExpenses = input.annualExpenses * inflationAtRetirement;
    const futureAnnualAow = input.aowMonthlyAmount * 12 * inflationAtRetirement;

    const yearsPreAow = Math.max(0, input.aowAge - retirementAge);
    const yearsPostAow = Math.max(0, input.lifeExpectancy - Math.max(retirementAge, input.aowAge));

    // Pre-AOW: full expenses, no AOW income
    const pvPreAow = this.pvAnnuity(futureAnnualExpenses, returnRate, inflationRate, yearsPreAow);

    // Post-AOW: expenses minus AOW (both inflation-adjusted from retirement)
    const annualNeedPostAow = Math.max(0, futureAnnualExpenses - futureAnnualAow);
    const pvPostAowAtAowAge = this.pvAnnuity(annualNeedPostAow, returnRate, inflationRate, yearsPostAow);

    // Discount post-AOW PV back to retirement date
    const discountFactor = returnRate > 0 ? Math.pow(1 + returnRate, yearsPreAow) : 1;
    const pvPostAow = pvPostAowAtAowAge / discountFactor;

    return pvPreAow + pvPostAow;
  }

  /** PV of an inflation-growing annuity: payments grow at inflationRate, discounted at returnRate */
  private pvAnnuity(annualPayment: number, returnRate: number, inflationRate: number, years: number): number {
    if (years <= 0 || annualPayment <= 0) return 0;

    const realRate = (1 + returnRate) / (1 + inflationRate) - 1;

    if (Math.abs(realRate) < 1e-10) {
      // Real rate ≈ 0: PV is simply payment × years
      return annualPayment * years;
    }

    return annualPayment * (1 - Math.pow(1 + realRate, -years)) / realRate;
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
