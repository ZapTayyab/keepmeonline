const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimalFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatWh(wh: number): string {
  return `${numberFormat.format(Math.round(wh))} Wh`;
}

export function formatWatts(watts: number): string {
  return `${oneDecimalFormat.format(watts)} W`;
}

export function formatPercent(fraction: number): string {
  return `${oneDecimalFormat.format(fraction * 100)}%`;
}

export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * MINUTES_PER_HOUR);
  if (totalMinutes < MINUTES_PER_HOUR) {
    return `${totalMinutes} min`;
  }
  if (totalMinutes < 2 * MINUTES_PER_DAY) {
    const h = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const m = totalMinutes % MINUTES_PER_HOUR;
    return `${h} h ${m} min`;
  }
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const remainingHours = Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  return `${days} days ${remainingHours} h`;
}

export function formatSignedDuration(hours: number): string {
  const sign = hours < 0 ? '-' : '';
  return `${sign}${formatDuration(Math.abs(hours))}`;
}

export function hoursFromParts(hours: number, minutes: number): number {
  return hours + minutes / MINUTES_PER_HOUR;
}
