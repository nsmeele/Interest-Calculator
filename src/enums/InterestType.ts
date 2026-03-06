export enum InterestType {
  Simple = 'simple',
  Compound = 'compound',
}

export const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  [InterestType.Simple]: 'Enkelvoudig',
  [InterestType.Compound]: 'Rente op rente',
};
