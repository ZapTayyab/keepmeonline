import { averageDeviceWatts, calculateRuntime } from '@/lib/calculations';
import type { CalculationInput, CalculationResult, Device } from '@/types/calculator';

export interface SuggestionItem {
  device: Device;
  batteryDrawSavedW: number;
  result: CalculationResult;
  improvementHours: number | null;
}

export interface ScenarioSet {
  current: CalculationResult;
  essentials: CalculationResult;
  essentialCount: number;
  suggestions: SuggestionItem[];
}

export function buildScenarios(input: CalculationInput): ScenarioSet {
  const current = calculateRuntime(input);

  const essentialDevices = input.devices.filter((d) => d.enabled && d.essential);
  const essentials = calculateRuntime({
    ...input,
    devices: input.devices.map((d) => ({ ...d, enabled: d.enabled && d.essential })),
  });

  const candidates = input.devices.filter(
    (d) => d.enabled && !d.essential && averageDeviceWatts(d) > 0
  );

  const suggestions: SuggestionItem[] = candidates
    .map((candidate) => {
      const result = calculateRuntime({
        ...input,
        devices: input.devices.map((d) => (d.id === candidate.id ? { ...d, enabled: false } : d)),
      });
      const improvementHours =
        current.runtimeHours !== null && result.runtimeHours !== null
          ? result.runtimeHours - current.runtimeHours
          : null;
      return {
        device: candidate,
        batteryDrawSavedW: current.batteryDrawW - result.batteryDrawW,
        result,
        improvementHours,
      };
    })
    .sort((a, b) => b.batteryDrawSavedW - a.batteryDrawSavedW);

  return {
    current,
    essentials,
    essentialCount: essentialDevices.length,
    suggestions,
  };
}
