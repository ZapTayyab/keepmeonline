import { describe, expect, it } from 'vitest';
import { formatDuration, formatSignedDuration } from '@/lib/formatting';
import { buildShareHash, readShareHash } from '@/lib/sharing';
import { createDefaultForm, sanitizeForm } from '@/lib/formState';

describe('formatDuration', () => {
  it('shows minutes under one hour', () => {
    expect(formatDuration(0.5)).toBe('30 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('shows hours and minutes for typical outages', () => {
    expect(formatDuration(5.76)).toBe('5 h 46 min');
    expect(formatDuration(4)).toBe('4 h 0 min');
  });

  it('shows days and hours for very long results', () => {
    expect(formatDuration(60)).toBe('2 days 12 h');
  });

  it('formats signed differences', () => {
    expect(formatSignedDuration(-0.5)).toBe('-30 min');
  });
});

describe('share links', () => {
  const form = createDefaultForm();

  it('round-trips settings without device ids', () => {
    const result = readShareHash(buildShareHash(form));
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.form.whText).toBe(form.whText);
    expect(result.form.devices.map((d) => d.name)).toEqual(form.devices.map((d) => d.name));
  });

  it('round-trips non-ASCII device names', () => {
    const named = { ...form, devices: [{ ...form.devices[0], name: 'Café ✓ router' }] };
    const result = readShareHash(buildShareHash(named));
    expect(result.kind === 'ok' && result.form.devices[0].name).toBe('Café ✓ router');
  });

  it('ignores hashes that are not share links', () => {
    expect(readShareHash('#calculator')).toEqual({ kind: 'none' });
    expect(readShareHash('')).toEqual({ kind: 'none' });
  });

  it('rejects damaged, unsupported, and oversized payloads', () => {
    expect(readShareHash('#config=v1.@@@').kind).toBe('error');
    expect(readShareHash('#config=v9.abc').kind).toBe('error');
    expect(readShareHash('#config=v1.' + 'A'.repeat(9000)).kind).toBe('error');
    expect(readShareHash('#config=v1.' + btoa('{"nope":1}').replace(/=+$/, '')).kind).toBe('error');
  });
});

describe('sanitizeForm', () => {
  it('rejects non-objects and unknown enum values', () => {
    expect(sanitizeForm(null)).toBeNull();
    expect(sanitizeForm({ ...createDefaultForm(), capacityMode: 'bogus' })).toBeNull();
  });

  it('rejects overlong text fields', () => {
    expect(sanitizeForm({ ...createDefaultForm(), whText: '1'.repeat(50) })).toBeNull();
  });

  it('caps the number of devices', () => {
    const device = createDefaultForm().devices[0];
    const many = Array.from({ length: 21 }, () => ({ ...device }));
    expect(sanitizeForm({ ...createDefaultForm(), devices: many })).toBeNull();
  });
});
