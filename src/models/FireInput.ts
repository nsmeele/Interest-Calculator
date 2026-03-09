export class FireInput {
  constructor(
    public readonly currentAge: number,
    public readonly currentSavings: number,
    public readonly monthlyIncome: number,
    public readonly monthlyExpenses: number,
    public readonly expectedReturnRate: number,
    public readonly inflationRate: number,
    public readonly safeWithdrawalRate: number,
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
}
