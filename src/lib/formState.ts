import { DEVICE_PRESETS, type DevicePreset } from '@/data/devicePresets';
import type { DeviceForm, FormState, PowerPath } from '@/types/calculator';

export const MAX_DEVICES = 20;
export const MAX_NAME_LENGTH = 40;
const MAX_TEXT_LENGTH = 12;

const TEXT_KEYS = [
  'whText',
  'voltageText',
  'ahText',
  'usablePercentText',
  'reservePercentText',
  'acEfficiencyText',
  'dcEfficiencyText',
  'inverterIdleText',
  'maxAcOutputText',
  'targetHoursText',
  'targetMinutesText',
] as const;

type TextKey = (typeof TEXT_KEYS)[number];

export function createDeviceId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function deviceFormFromPreset(preset: DevicePreset): DeviceForm {
  return {
    id: createDeviceId(),
    name: preset.name,
    wattsText: String(preset.watts),
    quantityText: String(preset.quantity),
    dutyText: String(preset.dutyPercent),
    path: preset.path,
    essential: preset.essential,
    enabled: preset.enabled,
  };
}

export function createCustomDeviceForm(): DeviceForm {
  return {
    id: createDeviceId(),
    name: 'Custom device',
    wattsText: '',
    quantityText: '1',
    dutyText: '100',
    path: 'ac',
    essential: false,
    enabled: true,
  };
}

export function duplicateDeviceForm(device: DeviceForm): DeviceForm {
  return { ...device, id: createDeviceId(), name: device.name.slice(0, MAX_NAME_LENGTH - 5) + ' copy' };
}

export function createDefaultForm(): FormState {
  return {
    capacityMode: 'wh',
    whText: '500',
    voltageText: '12',
    ahText: '100',
    usageMode: 'percent',
    usablePercentText: '80',
    reservePercentText: '10',
    acEfficiencyText: '85',
    dcEfficiencyText: '95',
    inverterIdleText: '0',
    maxAcOutputText: '',
    targetHoursText: '4',
    targetMinutesText: '0',
    devices: DEVICE_PRESETS.map(deviceFormFromPreset),
  };
}

export function withoutDeviceIds(form: FormState): FormState {
  return { ...form, devices: form.devices.map((device) => ({ ...device, id: '' })) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(source: Record<string, unknown>, key: string, maxLength: number): string | null {
  const value = source[key];
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readDevices(value: unknown): DeviceForm[] | null {
  if (!Array.isArray(value) || value.length > MAX_DEVICES) return null;
  const devices: DeviceForm[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const name = readText(item, 'name', MAX_NAME_LENGTH);
    const wattsText = readText(item, 'wattsText', MAX_TEXT_LENGTH);
    const quantityText = readText(item, 'quantityText', MAX_TEXT_LENGTH);
    const dutyText = readText(item, 'dutyText', MAX_TEXT_LENGTH);
    const path = readEnum<PowerPath>(item.path, ['ac', 'dc']);
    const essential = readBoolean(item.essential);
    const enabled = readBoolean(item.enabled);
    if (
      name === null ||
      wattsText === null ||
      quantityText === null ||
      dutyText === null ||
      path === null ||
      essential === null ||
      enabled === null
    ) {
      return null;
    }
    devices.push({
      id: createDeviceId(),
      name,
      wattsText,
      quantityText,
      dutyText,
      path,
      essential,
      enabled,
    });
  }
  return devices;
}

export function sanitizeForm(raw: unknown): FormState | null {
  if (!isRecord(raw)) return null;

  const capacityMode = readEnum(raw.capacityMode, ['wh', 'voltAmpHour'] as const);
  const usageMode = readEnum(raw.usageMode, ['percent', 'alreadyUsable'] as const);
  if (capacityMode === null || usageMode === null) return null;

  const texts = {} as Record<TextKey, string>;
  for (const key of TEXT_KEYS) {
    const text = readText(raw, key, MAX_TEXT_LENGTH);
    if (text === null) return null;
    texts[key] = text;
  }

  const devices = readDevices(raw.devices);
  if (devices === null) return null;

  return { capacityMode, usageMode, ...texts, devices };
}
