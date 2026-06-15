import { Box3Regime } from '../enums/Box3Regime';
import type { IBox3TaxStrategy } from '../interfaces/IBox3TaxStrategy';
import { ForfaitairTaxStrategy2026 } from '../strategies/ForfaitairTaxStrategy2026';
import { ActualReturnTaxStrategy2028 } from '../strategies/ActualReturnTaxStrategy2028';

export class Box3TaxStrategyFactory {
  private static readonly strategies: Record<Box3Regime, IBox3TaxStrategy> = {
    [Box3Regime.Forfaitair2026]: new ForfaitairTaxStrategy2026(),
    [Box3Regime.Actual2028]: new ActualReturnTaxStrategy2028(),
  };

  static create(regime: Box3Regime): IBox3TaxStrategy {
    return this.strategies[regime];
  }
}
