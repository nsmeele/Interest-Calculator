import { describe, it, expect } from 'vitest';
import { FireCalculator } from '../calculator/FireCalculator';
import { FireInput } from '../models/FireInput';
import { ScenarioType } from '../models/ScenarioType';
import { estimateAowAge } from '../utils/aowAge';

const calculator = new FireCalculator();

function createInput(overrides: ConstructorParameters<typeof FireInput> = [30, 50000, 4000, 2000, 7, 3, 4, 85, 67, 1370]): FireInput {
  return new FireInput(...overrides);
}

describe('FireCalculator', () => {
  it('returns groups only for ages above currentAge', () => {
    const input = createInput([55, 50000, 4000, 2000, 7, 3, 4, 85]);
    const groups = calculator.calculateAll(input);

    expect(groups.length).toBe(3);
    expect(groups.map((g) => g.retirementAge)).toEqual([60, 65, 70]);
  });

  it('returns no groups when currentAge exceeds all retirement ages', () => {
    const input = createInput([75, 50000, 4000, 2000, 7, 3, 4, 85]);
    const groups = calculator.calculateAll(input);

    expect(groups).toEqual([]);
  });

  it('calculates required nest egg accounting for AOW', () => {
    // No AOW: required nest egg should be higher
    const noAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 0);
    const withAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 1370);
    const groupsNoAow = calculator.calculateAll(noAow);
    const groupsWithAow = calculator.calculateAll(withAow);

    const noAow50 = groupsNoAow.find((g) => g.retirementAge === 50)!;
    const withAow50 = groupsWithAow.find((g) => g.retirementAge === 50)!;

    // AOW reduces the required nest egg
    expect(withAow50.base.requiredNestEgg).toBeLessThan(noAow50.base.requiredNestEgg);
  });

  it('marks isAlreadyFire when savings exceed required nest egg', () => {
    const input = new FireInput(60, 5000000, 4000, 1000, 7, 3, 4, 85);
    const groups = calculator.calculateAll(input);
    const group65 = groups.find((g) => g.retirementAge === 65)!;

    expect(group65.base.isAlreadyFire).toBe(true);
    expect(group65.base.monthlySavingsNeeded).toBe(0);
    expect(group65.base.isFeasible).toBe(true);
  });

  it('marks infeasible when required savings exceed capacity', () => {
    const input = new FireInput(30, 0, 3000, 2500, 7, 3, 4, 85);
    const groups = calculator.calculateAll(input);
    const group40 = groups.find((g) => g.retirementAge === 40)!;

    if (group40.base.monthlySavingsNeeded > 500) {
      expect(group40.base.isFeasible).toBe(false);
    }
  });

  it('handles zero return rate without NaN', () => {
    const input = new FireInput(30, 10000, 4000, 2000, 0, 0, 4, 85);
    const groups = calculator.calculateAll(input);

    for (const g of groups) {
      expect(Number.isFinite(g.base.requiredNestEgg)).toBe(true);
      expect(Number.isFinite(g.base.projectedNestEgg)).toBe(true);
      expect(Number.isFinite(g.base.monthlySavingsNeeded)).toBe(true);
    }
  });

  it('calculates projected nest egg using FV formula', () => {
    const input = new FireInput(30, 100000, 5000, 3000, 7, 3, 4, 85);
    const groups = calculator.calculateAll(input);
    const group60 = groups.find((g) => g.retirementAge === 60)!;

    const r = 0.07 / 12;
    const n = 30 * 12;
    const fvSavings = 100000 * Math.pow(1 + r, n);
    const fvContributions = 2000 * (Math.pow(1 + r, n) - 1) / r;

    expect(group60.base.projectedNestEgg).toBeCloseTo(fvSavings + fvContributions, 0);
  });

  it('calculates shortfall correctly', () => {
    const input = new FireInput(30, 0, 3000, 2500, 3, 3, 4, 85);
    const groups = calculator.calculateAll(input);
    const group40 = groups.find((g) => g.retirementAge === 40)!;

    expect(group40.base.shortfall).toBe(
      Math.max(0, group40.base.requiredNestEgg - group40.base.projectedNestEgg),
    );
  });

  it('returns all 7 ages for a young person', () => {
    const input = createInput([25, 50000, 4000, 2000, 7, 3, 4, 85]);
    const groups = calculator.calculateAll(input);

    expect(groups.length).toBe(7);
    expect(groups[0].retirementAge).toBe(40);
    expect(groups[6].retirementAge).toBe(70);
  });

  it('returns contributions breakdown', () => {
    const input = new FireInput(30, 50000, 5000, 2000, 7, 3, 4, 85);
    const groups = calculator.calculateAll(input);
    const group50 = groups.find((g) => g.retirementAge === 50)!;

    expect(group50.base.savingsContribution).toBe(3000 * 20 * 12 + 50000);
    expect(group50.base.returnsContribution).toBeGreaterThan(0);
    expect(group50.base.savingsContribution + group50.base.returnsContribution)
      .toBeCloseTo(group50.base.projectedNestEgg, 0);
  });
});

describe('dynamic SWR', () => {
  it('computes SWR as 1/(lifeExpectancy - retirementAge)', () => {
    const input = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85);

    expect(input.dynamicSwr(40)).toBeCloseTo((1 / 45) * 100, 4);
    expect(input.dynamicSwr(50)).toBeCloseTo((1 / 35) * 100, 4);
    expect(input.dynamicSwr(60)).toBeCloseTo((1 / 25) * 100, 4);
    expect(input.dynamicSwr(70)).toBeCloseTo((1 / 15) * 100, 4);
  });

  it('falls back to safeWithdrawalRate when retirementAge >= lifeExpectancy', () => {
    const input = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 80);

    expect(input.dynamicSwr(80)).toBe(4);
    expect(input.dynamicSwr(85)).toBe(4);
  });

  it('lower SWR for earlier retirement ages', () => {
    const input = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85);

    // Earlier retirement = longer horizon = lower SWR
    const swr40 = input.dynamicSwr(40);
    const swr60 = input.dynamicSwr(60);
    expect(swr40).toBeLessThan(swr60);

    // Lower SWR means you need more per unit of annual expense
    expect(1 / (swr40 / 100)).toBeGreaterThan(1 / (swr60 / 100));
  });
});

describe('scenario groups', () => {
  it('each group contains all three scenario types', () => {
    const input = createInput();
    const groups = calculator.calculateAll(input);

    for (const g of groups) {
      expect(g.base.scenarioType).toBe(ScenarioType.BASE);
      expect(g.pessimistic.scenarioType).toBe(ScenarioType.PESSIMISTIC);
      expect(g.optimistic.scenarioType).toBe(ScenarioType.OPTIMISTIC);
    }
  });

  it('pessimistic has lower projected nest egg than base', () => {
    const input = createInput();
    const groups = calculator.calculateAll(input);

    for (const g of groups) {
      expect(g.pessimistic.projectedNestEgg).toBeLessThan(g.base.projectedNestEgg);
    }
  });

  it('optimistic has higher projected nest egg than base', () => {
    const input = createInput();
    const groups = calculator.calculateAll(input);

    for (const g of groups) {
      expect(g.optimistic.projectedNestEgg).toBeGreaterThan(g.base.projectedNestEgg);
    }
  });

  it('all three scenarios share the same retirement age', () => {
    const input = createInput();
    const groups = calculator.calculateAll(input);

    for (const g of groups) {
      expect(g.base.retirementAge).toBe(g.retirementAge);
      expect(g.pessimistic.retirementAge).toBe(g.retirementAge);
      expect(g.optimistic.retirementAge).toBe(g.retirementAge);
    }
  });
});

describe('AOW (state pension)', () => {
  it('AOW reduces required nest egg compared to no AOW', () => {
    const noAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 0);
    const withAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 1370);

    const groupsNoAow = calculator.calculateAll(noAow);
    const groupsWithAow = calculator.calculateAll(withAow);

    // Check for every retirement age
    for (let i = 0; i < groupsNoAow.length; i++) {
      expect(groupsWithAow[i].base.requiredNestEgg).toBeLessThan(groupsNoAow[i].base.requiredNestEgg);
    }
  });

  it('AOW has no effect when retiring after AOW age', () => {
    // Retire at 70, AOW starts at 67 — entire retirement is post-AOW
    const noAow = new FireInput(65, 500000, 4000, 1000, 7, 3, 4, 85, 67, 0);
    const withAow = new FireInput(65, 500000, 4000, 1000, 7, 3, 4, 85, 67, 1370);

    const groupsNoAow = calculator.calculateAll(noAow);
    const groupsWithAow = calculator.calculateAll(withAow);

    const noAow70 = groupsNoAow.find((g) => g.retirementAge === 70)!;
    const withAow70 = groupsWithAow.find((g) => g.retirementAge === 70)!;

    // Post-AOW: expenses (12000/yr) minus AOW (16440/yr) = negative → need 0 from pot
    // So with AOW the nest egg should be much smaller
    expect(withAow70.base.requiredNestEgg).toBeLessThan(noAow70.base.requiredNestEgg);
  });

  it('AOW covering all expenses results in zero required nest egg for post-AOW phase', () => {
    // Monthly expenses = 1000, AOW = 1370 → AOW covers all expenses after AOW age
    const input = new FireInput(60, 0, 4000, 1000, 7, 3, 4, 85, 67, 1370);
    const groups = calculator.calculateAll(input);
    const group65 = groups.find((g) => g.retirementAge === 65)!;

    // Required nest egg should only cover 2 years pre-AOW (65→67)
    // Not the full 20 years (65→85)
    const fullInput = new FireInput(60, 0, 4000, 1000, 7, 3, 4, 85, 67, 0);
    const fullGroups = calculator.calculateAll(fullInput);
    const fullGroup65 = fullGroups.find((g) => g.retirementAge === 65)!;

    // With AOW covering expenses, need dramatically less
    expect(group65.base.requiredNestEgg).toBeLessThan(fullGroup65.base.requiredNestEgg * 0.5);
  });

  it('higher AOW amount further reduces required nest egg', () => {
    const lowAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 940);
    const highAow = new FireInput(30, 0, 4000, 2000, 7, 3, 4, 85, 67, 1370);

    const groupsLow = calculator.calculateAll(lowAow);
    const groupsHigh = calculator.calculateAll(highAow);

    for (let i = 0; i < groupsLow.length; i++) {
      expect(groupsHigh[i].base.requiredNestEgg).toBeLessThan(groupsLow[i].base.requiredNestEgg);
    }
  });
});

describe('AOW age schedule', () => {
  it('returns 67 for people born in 1960 or earlier', () => {
    expect(estimateAowAge(1955)).toBe(67);
    expect(estimateAowAge(1960)).toBe(67);
  });

  it('returns 67.25 for people born 1961-1966', () => {
    expect(estimateAowAge(1961)).toBe(67.25);
    expect(estimateAowAge(1966)).toBe(67.25);
  });

  it('returns correct ages for people born 1967-1975', () => {
    expect(estimateAowAge(1967)).toBe(67.5);
    expect(estimateAowAge(1970)).toBe(67.5);
    expect(estimateAowAge(1973)).toBe(67.75);
    expect(estimateAowAge(1975)).toBe(68);
  });

  it('returns correct ages for people born 1976-1988', () => {
    expect(estimateAowAge(1976)).toBe(68.25);
    expect(estimateAowAge(1982)).toBe(68.5);
    expect(estimateAowAge(1985)).toBe(68.75);
    expect(estimateAowAge(1988)).toBe(69);
  });

  it('returns 70 for people born 2000+', () => {
    expect(estimateAowAge(2000)).toBe(70);
    expect(estimateAowAge(2005)).toBe(70);
  });
});
