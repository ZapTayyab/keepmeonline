import { describe, expect, it } from 'vitest';
import {
  averageDeviceWatts,
  calculateRuntime,
  energyFromVoltageAh,
  summarizeLoads,
} from '@/lib/calculations';
import type { CalculationInput, Device } from '@/types/calculator';

const EPS = 1e-9;

function device(overrides: Partial<Device> = {}): Device {
  return {
    id: 'd',
    name: 'Device',
    watts: 10,
    quantity: 1,
    dutyPercent: 100,
    path: 'ac',
    essential: false,
    enabled: true,
    ...overrides,
  };
}

function input(overrides: Partial<CalculationInput> = {}): CalculationInput {
  return {
    nominalWh: 1000,
    energyIsUsable: false,
    usableFraction: 0.8,
    reserveFraction: 0.1,
    acEfficiencyFraction: 0.85,
    dcEfficiencyFraction: 0.95,
    inverterIdleW: 5,
    maxAcOutputW: null,
    targetHours: 4,
    devices: [],
    ...overrides,
  };
}

const EXACT_DEVICES = [
  device({ id: 'ac', name: 'AC load', watts: 85, path: 'ac' }),
  device({ id: 'dc', name: 'DC load', watts: 19, path: 'dc' }),
];

describe('reference scenario', () => {
  const result = calculateRuntime(input({ devices: EXACT_DEVICES }));

  it('derives usable and planning energy', () => {
    expect(result.usableWh).toBeCloseTo(800, 9);
    expect(result.planningWh).toBeCloseTo(720, 9);
  });

  it('applies conversion losses and idle draw once', () => {
    expect(result.batteryDrawW).toBeCloseTo(125, 9);
  });

  it('computes runtime as planning energy over draw', () => {
    expect(result.runtimeHours).toBeCloseTo(5.76, 9);
  });

  it('computes required usable and nominal energy for a 4 hour target', () => {
    const target4 = calculateRuntime(input({ devices: EXACT_DEVICES, targetHours: 4 }));
    expect(target4.requiredUsableWh).toBeCloseTo(555.5555555555555, 6);
    expect(target4.requiredNominalWh).toBeCloseTo(694.4444444444443, 6);
  });
});

describe('capacity inputs', () => {
  it('converts volts and amp-hours to watt-hours', () => {
    expect(energyFromVoltageAh(12, 100)).toBe(1200);
    expect(energyFromVoltageAh(12.8, 50)).toBeCloseTo(640, EPS);
  });

  it('uses the entered energy directly when it is already usable', () => {
    const result = calculateRuntime(
      input({ energyIsUsable: true, devices: EXACT_DEVICES, nominalWh: 800 })
    );
    expect(result.usableWh).toBe(800);
    expect(result.requiredNominalWh).toBeNull();
    expect(result.requiredUsableWh).toBeCloseTo(125 * 4 / 0.9, 6);
  });

  it('applies reserve once after usable share', () => {
    const noReserve = calculateRuntime(input({ devices: EXACT_DEVICES, reserveFraction: 0 }));
    const withReserve = calculateRuntime(input({ devices: EXACT_DEVICES }));
    expect(noReserve.planningWh).toBeCloseTo(800, EPS);
    expect(withReserve.planningWh / noReserve.planningWh).toBeCloseTo(0.9, EPS);
  });
});

describe('load composition', () => {
  it('handles AC-only load with idle draw', () => {
    const result = calculateRuntime(input({ devices: [device({ watts: 85 })] }));
    expect(result.acLoadW).toBe(85);
    expect(result.dcLoadW).toBe(0);
    expect(result.batteryDrawW).toBeCloseTo(100 + 5, EPS);
  });

  it('handles DC-only load without inverter idle draw', () => {
    const result = calculateRuntime(
      input({ devices: [device({ watts: 19, path: 'dc' })] })
    );
    expect(result.idleW).toBe(0);
    expect(result.batteryDrawW).toBeCloseTo(19 / 0.95, EPS);
  });

  it('removes AC conversion and idle draw when the AC device is disabled', () => {
    const withAc = calculateRuntime(input({ devices: EXACT_DEVICES }));
    const withoutAc = calculateRuntime(
      input({
        devices: EXACT_DEVICES.map((d) => (d.path === 'ac' ? { ...d, enabled: false } : d)),
      })
    );
    expect(withAc.batteryDrawW - withoutAc.batteryDrawW).toBeCloseTo(100 + 5, EPS);
    expect(withoutAc.idleW).toBe(0);
    expect(withoutAc.batteryDrawW).toBeCloseTo(19 / 0.95, EPS);
  });

  it('multiplies watts by quantity and duty percentage', () => {
    const d = device({ watts: 20, quantity: 3, dutyPercent: 50 });
    expect(averageDeviceWatts(d)).toBe(30);
    const { acLoadW, acNameplateW } = summarizeLoads([d]);
    expect(acLoadW).toBe(30);
    expect(acNameplateW).toBe(60);
  });

  it('ignores disabled devices entirely', () => {
    const { acLoadW, dcLoadW, acNameplateW } = summarizeLoads([
      device({ watts: 100, enabled: false }),
      device({ watts: 10, path: 'dc' }),
    ]);
    expect(acLoadW).toBe(0);
    expect(dcLoadW).toBe(10);
    expect(acNameplateW).toBe(0);
  });
});

describe('edge cases', () => {
  it('reports no load without a runtime figure', () => {
    const result = calculateRuntime(input({ devices: [] }));
    expect(result.status).toBe('no-load');
    expect(result.runtimeHours).toBeNull();
    expect(result.requiredUsableWh).toBeNull();
  });

  it('treats zero-duty devices as no load', () => {
    const result = calculateRuntime(input({ devices: [device({ dutyPercent: 0 })] }));
    expect(result.status).toBe('no-load');
  });

  it('reports invalid when an intermediate value is not finite', () => {
    const result = calculateRuntime(input({ nominalWh: Number.POSITIVE_INFINITY, devices: EXACT_DEVICES }));
    expect(result.status).toBe('invalid');
    expect(result.runtimeHours).toBeNull();
  });

  it('classifies meets, close, and shortfall against the target', () => {
    const devices = [device({ watts: 100 })];
    const lossless = { devices, inverterIdleW: 0, reserveFraction: 0, usableFraction: 1, acEfficiencyFraction: 1 };
    expect(calculateRuntime(input(lossless)).runtimeHours).toBeCloseTo(10, EPS);

    expect(calculateRuntime(input({ ...lossless, targetHours: 10 })).status).toBe('meets');
    expect(calculateRuntime(input({ ...lossless, targetHours: 10.5 })).status).toBe('close');
    expect(calculateRuntime(input({ ...lossless, targetHours: 11.2 })).status).toBe('shortfall');
  });

  it('flags a connected AC load above the output limit using nameplate watts', () => {
    const devices = [device({ watts: 60, quantity: 2, dutyPercent: 10 })];
    expect(calculateRuntime(input({ devices, maxAcOutputW: 100 })).outputLimitExceeded).toBe(true);
    expect(calculateRuntime(input({ devices, maxAcOutputW: 120 })).outputLimitExceeded).toBe(false);
  });
});
