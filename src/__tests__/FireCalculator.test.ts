import { describe, it, expect } from 'vitest';
import { FireCalculator } from '../calculator/FireCalculator';
import { FireInput } from '../models/FireInput';

const calculator = new FireCalculator();

function createInput(overrides: ConstructorParameters<typeof FireInput> = [30, 50000, 4000, 2000, 7, 2, 4]): FireInput {
  return new FireInput(...overrides);
}

describe('FireCalculator', () => {
  it('returns scenarios only for ages above currentAge', () => {
    const input = createInput([55, 50000, 4000, 2000, 7, 2, 4]);
    const scenarios = calculator.calculateAll(input);

    expect(scenarios.length).toBe(3);
    expect(scenarios.map((s) => s.retirementAge)).toEqual([60, 65, 70]);
  });

  it('returns no scenarios when currentAge exceeds all retirement ages', () => {
    const input = createInput([75, 50000, 4000, 2000, 7, 2, 4]);
    const scenarios = calculator.calculateAll(input);

    expect(scenarios).toEqual([]);
  });

  it('calculates required nest egg with inflation adjustment', () => {
    const input = new FireInput(30, 0, 4000, 2000, 7, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario50 = scenarios.find((s) => s.retirementAge === 50)!;

    // Annual expenses = 24000, inflated over 20 years at 2%
    const inflatedExpenses = 24000 * Math.pow(1.02, 20);
    const expectedNestEgg = inflatedExpenses / 0.04;

    expect(scenario50.requiredNestEgg).toBeCloseTo(expectedNestEgg, 2);
  });

  it('marks isAlreadyFire when savings exceed required nest egg', () => {
    const input = new FireInput(60, 5000000, 4000, 1000, 7, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario65 = scenarios.find((s) => s.retirementAge === 65)!;

    expect(scenario65.isAlreadyFire).toBe(true);
    expect(scenario65.monthlySavingsNeeded).toBe(0);
    expect(scenario65.isFeasible).toBe(true);
  });

  it('marks infeasible when required savings exceed capacity', () => {
    const input = new FireInput(30, 0, 3000, 2500, 7, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario40 = scenarios.find((s) => s.retirementAge === 40)!;

    // With only 500/month capacity and 10 years, reaching FIRE at 40 is very hard
    if (scenario40.monthlySavingsNeeded > 500) {
      expect(scenario40.isFeasible).toBe(false);
    }
  });

  it('handles zero return rate without NaN', () => {
    const input = new FireInput(30, 10000, 4000, 2000, 0, 0, 4);
    const scenarios = calculator.calculateAll(input);

    for (const s of scenarios) {
      expect(Number.isFinite(s.requiredNestEgg)).toBe(true);
      expect(Number.isFinite(s.projectedNestEgg)).toBe(true);
      expect(Number.isFinite(s.monthlySavingsNeeded)).toBe(true);
    }
  });

  it('calculates projected nest egg using FV formula', () => {
    const input = new FireInput(30, 100000, 5000, 3000, 7, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario60 = scenarios.find((s) => s.retirementAge === 60)!;

    const r = 0.07 / 12;
    const n = 30 * 12;
    const fvSavings = 100000 * Math.pow(1 + r, n);
    const fvContributions = 2000 * (Math.pow(1 + r, n) - 1) / r;

    expect(scenario60.projectedNestEgg).toBeCloseTo(fvSavings + fvContributions, 0);
  });

  it('calculates shortfall correctly', () => {
    const input = new FireInput(30, 0, 3000, 2500, 3, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario40 = scenarios.find((s) => s.retirementAge === 40)!;

    expect(scenario40.shortfall).toBe(
      Math.max(0, scenario40.requiredNestEgg - scenario40.projectedNestEgg),
    );
  });

  it('returns all 7 ages for a young person', () => {
    const input = createInput([25, 50000, 4000, 2000, 7, 2, 4]);
    const scenarios = calculator.calculateAll(input);

    expect(scenarios.length).toBe(7);
    expect(scenarios[0].retirementAge).toBe(40);
    expect(scenarios[6].retirementAge).toBe(70);
  });

  it('returns contributions breakdown', () => {
    const input = new FireInput(30, 50000, 5000, 2000, 7, 2, 4);
    const scenarios = calculator.calculateAll(input);
    const scenario50 = scenarios.find((s) => s.retirementAge === 50)!;

    expect(scenario50.savingsContribution).toBe(3000 * 20 * 12 + 50000);
    expect(scenario50.returnsContribution).toBeGreaterThan(0);
    expect(scenario50.savingsContribution + scenario50.returnsContribution)
      .toBeCloseTo(scenario50.projectedNestEgg, 0);
  });
});
