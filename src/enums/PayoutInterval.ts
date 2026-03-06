export enum PayoutInterval {
  Daily = 'daily',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  SemiAnnually = 'semi_annually',
  Annually = 'annually',
  AtMaturity = 'at_maturity',
}

export const INTERVAL_LABELS: Record<PayoutInterval, string> = {
  [PayoutInterval.Daily]: 'Dagelijks',
  [PayoutInterval.Monthly]: 'Maandelijks',
  [PayoutInterval.Quarterly]: 'Per kwartaal',
  [PayoutInterval.SemiAnnually]: 'Per half jaar',
  [PayoutInterval.Annually]: 'Per jaar',
  [PayoutInterval.AtMaturity]: 'Einde looptijd',
};

export function getPeriodsPerYear(interval: PayoutInterval): number {
  switch (interval) {
    case PayoutInterval.Daily: return 365;
    case PayoutInterval.Monthly: return 12;
    case PayoutInterval.Quarterly: return 4;
    case PayoutInterval.SemiAnnually: return 2;
    case PayoutInterval.Annually: return 1;
    case PayoutInterval.AtMaturity: return 1;
  }
}
