import { InterestType } from '../enums/InterestType';
import type { IInterestStrategy } from '../interfaces/IInterestStrategy';
import { CompoundInterestStrategy } from '../strategies/CompoundInterestStrategy';
import { SimpleInterestStrategy } from '../strategies/SimpleInterestStrategy';

export class InterestStrategyFactory {
  private static readonly strategies: Record<string, IInterestStrategy> = {
    simple: new SimpleInterestStrategy(),
    compound: new CompoundInterestStrategy(),
  };

  static create(interestType: InterestType): IInterestStrategy {
    if (interestType === InterestType.Compound) {
      return this.strategies.compound;
    }
    return this.strategies.simple;
  }
}
