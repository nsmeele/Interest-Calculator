export enum DayCountConvention {
  NOM_12 = 'nom_12',
  ACT_365 = 'act_365',
  ACT_ACT = 'act_act',
  THIRTY_360 = '30_360',
}

export const DAY_COUNT_LABELS: Record<DayCountConvention, string> = {
  [DayCountConvention.NOM_12]: 'NOM/12',
  [DayCountConvention.ACT_365]: 'ACT/365',
  [DayCountConvention.ACT_ACT]: 'ACT/ACT',
  [DayCountConvention.THIRTY_360]: '30/360',
};

export const DAY_COUNT_DESCRIPTIONS: Record<DayCountConvention, string> = {
  [DayCountConvention.NOM_12]: 'Nominaal op jaarbasis: rente per maand = 1/12 van het jaartarief, ongeacht het aantal dagen in de maand. Meest gebruikt door Nederlandse banken.',
  [DayCountConvention.ACT_ACT]: 'Werkelijk aantal dagen per maand, 365 of 366 dagen per jaar. Gebruikt door o.a. Zweedse banken (Lea Bank, Brocc).',
  [DayCountConvention.ACT_365]: 'Werkelijk aantal dagen per maand, altijd 365 dagen per jaar (ook in een schrikkeljaar).',
  [DayCountConvention.THIRTY_360]: 'Elke maand telt als 30 dagen, elk jaar als 360 dagen. Gebruikt door o.a. Duitse banken (BW-Bank).',
};
