import type { CalculationResult, TargetStatus } from '@/types/calculator';
import type { ScenarioSet } from '@/lib/scenarios';
import { formatDuration, formatWh } from '@/lib/formatting';

export function describeStatus(status: TargetStatus): string {
  switch (status) {
    case 'meets':
      return 'Meets target';
    case 'close':
      return 'Close to target';
    case 'shortfall':
      return 'Falls short of target';
    case 'no-load':
      return 'No load';
    case 'invalid':
      return 'Cannot estimate';
  }
}

export function describeRuntime(result: CalculationResult): string {
  if (result.status === 'no-load') return 'Add or enable a device to estimate runtime.';
  if (result.runtimeHours === null) return 'Not available';
  return formatDuration(result.runtimeHours);
}

export function buildResultSummary(scenarios: ScenarioSet): string {
  const { current, essentials, essentialCount } = scenarios;
  const batteryLabel = current.input.energyIsUsable
    ? `${formatWh(current.nominalWh)} usable`
    : `${formatWh(current.nominalWh)} nominal`;
  const essentialLine =
    essentialCount > 0
      ? `Essential devices only: ${describeRuntime(essentials)} (${describeStatus(essentials.status)})`
      : 'Essential devices only: no essential devices selected';

  return [
    'Keep Me Online power-cut estimate (planning estimate only)',
    `Battery: ${batteryLabel}`,
    `Target outage: ${formatDuration(current.input.targetHours)}`,
    `Current setup: ${describeRuntime(current)} (${describeStatus(current.status)})`,
    essentialLine,
  ].join('\n');
}
