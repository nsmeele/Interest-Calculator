export const FIRE_DEFAULT_LIFE_EXPECTANCY = 85;
export const FIRE_DEFAULT_AOW_AGE = 67;
export const FIRE_DEFAULT_AOW_MONTHLY = 1370;

export class FireInput {
  constructor(
    public readonly currentAge: number,
    public readonly currentSavings: number,
    public readonly monthlyIncome: number,
    public readonly monthlyExpenses: number,
    public readonly expectedReturnRate: number,
    public readonly inflationRate: number,
    public readonly safeWithdrawalRate: number,
    public readonly lifeExpectancy: number = FIRE_DEFAULT_LIFE_EXPECTANCY,
    public readonly aowAge: number = FIRE_DEFAULT_AOW_AGE,
    public readonly aowMonthlyAmount: number = FIRE_DEFAULT_AOW_MONTHLY,
  ) {}

  get monthlySavingsCapacity(): number {
    return this.monthlyIncome - this.monthlyExpenses;
  }

  get annualExpenses(): number {
    return this.monthlyExpenses * 12;
  }

  yearsToRetirement(retirementAge: number): number {
    return retirementAge - this.currentAge;
  }

  /** Compute SWR based on retirement horizon: 1 / (lifeExpectancy - retirementAge) */
  dynamicSwr(retirementAge: number): number {
    const years = this.lifeExpectancy - retirementAge;
    if (years <= 0) return this.safeWithdrawalRate;
    return (1 / years) * 100;
  }
}
