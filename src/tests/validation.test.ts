import { describe, expect, it } from 'vitest';
import { validateForm, parseNumber } from '@/lib/validation';
import { createDefaultForm } from '@/lib/formState';
import type { FormState } from '@/types/calculator';

function validForm(overrides: Partial<FormState> = {}): FormState {
  return { ...createDefaultForm(), ...overrides };
}

describe('parseNumber', () => {
  it('accepts plain decimal text and rejects everything else', () => {
    expect(parseNumber(' 12.5 ')).toBe(12.5);
    expect(parseNumber('.5')).toBe(0.5);
    expect(parseNumber('-3')).toBe(-3);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1e3')).toBeNull();
    expect(parseNumber('Infinity')).toBeNull();
  });
});

describe('validateForm', () => {
  it('accepts the default form and maps it to calculation input', () => {
    const result = validateForm(createDefaultForm());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.nominalWh).toBe(500);
    expect(result.input.usableFraction).toBeCloseTo(0.8, 12);
    expect(result.input.reserveFraction).toBeCloseTo(0.1, 12);
    expect(result.input.targetHours).toBe(4);
    expect(result.input.maxAcOutputW).toBeNull();
  });

  it('converts volts and amp-hours when that mode is selected', () => {
    const result = validateForm(validForm({ capacityMode: 'voltAmpHour', voltageText: '12', ahText: '100' }));
    expect(result.ok && result.input.nominalWh).toBe(1200);
  });

  it('marks usable share as unused when the energy is already usable', () => {
    const result = validateForm(validForm({ usageMode: 'alreadyUsable', usablePercentText: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.energyIsUsable).toBe(true);
  });

  it('rejects empty, negative, and out-of-range values with field messages', () => {
    const cases: Array<[Partial<FormState>, string]> = [
      [{ whText: '' }, 'capacity'],
      [{ whText: '-100' }, 'capacity'],
      [{ capacityMode: 'voltAmpHour', voltageText: '0', ahText: '100' }, 'capacity'],
      [{ usablePercentText: '0' }, 'usable'],
      [{ usablePercentText: '101' }, 'usable'],
      [{ reservePercentText: '100' }, 'reserve'],
      [{ reservePercentText: '-1' }, 'reserve'],
      [{ acEfficiencyText: '0' }, 'acEfficiency'],
      [{ dcEfficiencyText: '120' }, 'dcEfficiency'],
      [{ inverterIdleText: '-5' }, 'inverterIdle'],
      [{ maxAcOutputText: '0' }, 'outputLimit'],
      [{ targetHoursText: '' }, 'target'],
      [{ targetHoursText: '0', targetMinutesText: '0' }, 'target'],
      [{ targetMinutesText: '75' }, 'target'],
    ];
    for (const [overrides, field] of cases) {
      const result = validateForm(validForm(overrides));
      expect(result.ok, JSON.stringify(overrides)).toBe(false);
      if (!result.ok) expect(result.errors[field], JSON.stringify(overrides)).toBeTruthy();
    }
  });

  it('rejects invalid device rows and keys the error to that row', () => {
    const form = createDefaultForm();
    const target = form.devices[0];
    const result = validateForm({
      ...form,
      devices: [
        { ...target, wattsText: 'lots' },
        { ...form.devices[1], dutyText: '150', quantityText: '1.5' },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[`device:${target.id}:watts`]).toBeTruthy();
    expect(result.errors[`device:${form.devices[1].id}:duty`]).toBeTruthy();
    expect(result.errors[`device:${form.devices[1].id}:quantity`]).toBeTruthy();
  });

  it('accepts a form with no enabled devices, since that is a result state', () => {
    const form = createDefaultForm();
    const result = validateForm({
      ...form,
      devices: form.devices.map((d) => ({ ...d, enabled: false })),
    });
    expect(result.ok).toBe(true);
  });
});
