/** Shared Recharts color tokens – grid / tick / axis come from CSS custom properties. */

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface ChartColors {
  grid: string;
  tick: string;
  axis: string;
}

export function getChartColors(): ChartColors {
  return {
    grid: getCSSVar('--chart-grid'),
    tick: getCSSVar('--chart-tick'),
    axis: getCSSVar('--chart-axis'),
  };
}
