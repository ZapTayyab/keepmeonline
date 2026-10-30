import { describe, expect, it } from 'vitest';
import { buildScenarios } from '@/lib/scenarios';
import { calculateRuntime } from '@/lib/calculations';
import { WORKED_EXAMPLES } from '@/data/workedExamples';
import type { CalculationInput, Device } from '@/types/calculator';

const base: Omit<CalculationInput, 'devices'> = {
  nominalWh: 500,
  energyIsUsable: false,
  usableFraction: 0.8,
  reserveFraction: 0.1,
  acEfficiencyFraction: 0.85,
  dcEfficiencyFraction: 0.95,
  inverterIdleW: 5,
  maxAcOutputW: null,
  targetHours: 4,
};

function ac(id: string, watts: number, essential: boolean): Device {
  return { id, name: id, watts, quantity: 1, dutyPercent: 100, path: 'ac', essential, enabled: true };
}

describe('essential-only scenario', () => {
  it('removes nonessential devices and recalculates idle draw from remaining AC load', () => {
    const devices = [ac('router', 10, true), ac('laptop', 45, false)];
    const scenarios = buildScenarios({ ...base, devices });
    expect(scenarios.essentialCount).toBe(1);
    expect(scenarios.essentials.acLoadW).toBe(10);
    expect(scenarios.essentials.batteryDrawW).toBeCloseTo(10 / 0.85 + 5, 9);
  });

  it('drops inverter idle draw when no essential AC device remains', () => {
    const devices = [ac('laptop', 45, false)];
    const scenarios = buildScenarios({ ...base, devices });
    expect(scenarios.essentialCount).toBe(0);
    expect(scenarios.essentials.status).toBe('no-load');
  });
});

describe('suggested changes', () => {
  it('ranks nonessential devices by battery-side draw, highest first', () => {
    const devices = [ac('router', 10, true), ac('fan', 45, false), ac('led', 9, false)];
    const { suggestions } = buildScenarios({ ...base, devices });
    expect(suggestions.map((s) => s.device.id)).toEqual(['fan', 'led']);
    expect(suggestions[0].batteryDrawSavedW).toBeCloseTo(45 / 0.85, 9);
  });

  it('recalculates the whole scenario for each switched-off device', () => {
    const devices = [ac('router', 10, true), ac('laptop', 45, false)];
    const { current, suggestions } = buildScenarios({ ...base, devices });
    const expected = calculateRuntime({
      ...base,
      devices: devices.map((d) => (d.id === 'laptop' ? { ...d, enabled: false } : d)),
    });
    expect(suggestions[0].result.runtimeHours).toBeCloseTo(expected.runtimeHours ?? NaN, 9);
    expect(suggestions[0].improvementHours).toBeCloseTo(
      (expected.runtimeHours ?? 0) - (current.runtimeHours ?? 0),
      9
    );
    expect(suggestions[0].improvementHours).toBeGreaterThan(0);
  });

  it('removes the inverter idle draw when the last AC device is switched off', () => {
    const devices = [ac('laptop', 45, false)];
    const { suggestions } = buildScenarios({ ...base, devices });
    expect(suggestions[0].result.idleW).toBe(0);
    expect(suggestions[0].batteryDrawSavedW).toBeCloseTo(45 / 0.85 + 5, 9);
  });

  it('skips devices that are already off or draw nothing', () => {
    const devices = [ac('a', 0, false), { ...ac('b', 50, false), enabled: false }];
    expect(buildScenarios({ ...base, devices }).suggestions).toEqual([]);
  });
});

describe('worked examples', () => {
  it('match the hand-calculated runtimes', () => {
    const [routerOnt, withLaptop] = WORKED_EXAMPLES;
    expect(routerOnt.result.runtimeHours).toBeCloseTo(360 / (18 / 0.85), 9);
    expect(withLaptop.result.runtimeHours).toBeCloseTo(360 / (63 / 0.85), 9);
  });

  it('are the same numbers the calculator produces for their inputs', () => {
    for (const example of WORKED_EXAMPLES) {
      const recalculated = calculateRuntime(example.input);
      expect(recalculated.runtimeHours).toBe(example.result.runtimeHours);
      expect(recalculated.batteryDrawW).toBe(example.result.batteryDrawW);
    }
  });
});
