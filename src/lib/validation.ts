import { energyFromVoltageAh } from '@/lib/calculations';
import { MAX_NAME_LENGTH } from '@/lib/formState';
import type { CalculationInput, Device, DeviceForm, FormErrors, FormState } from '@/types/calculator';

export type ValidationResult =
  | { ok: true; input: CalculationInput }
  | { ok: false; errors: FormErrors };

export function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function parseDevice(device: DeviceForm, errors: FormErrors): Device | null {
  const key = (field: string) => `device:${device.id}:${field}`;
  const name = device.name.trim();
  let valid = true;

  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    errors[key('name')] = `Give this device a name up to ${MAX_NAME_LENGTH} characters.`;
    valid = false;
  }

  const watts = parseNumber(device.wattsText);
  if (watts === null || watts < 0 || watts > 10000) {
    errors[key('watts')] = 'Enter watts from 0 to 10,000.';
    valid = false;
  }

  const quantity = parseNumber(device.quantityText);
  if (quantity === null || !Number.isInteger(quantity) || quantity < 0 || quantity > 999) {
    errors[key('quantity')] = 'Enter a whole number from 0 to 999.';
    valid = false;
  }

  const duty = parseNumber(device.dutyText);
  if (duty === null || duty < 0 || duty > 100) {
    errors[key('duty')] = 'Enter a percentage from 0 to 100.';
    valid = false;
  }

  if (!valid || watts === null || quantity === null || duty === null) return null;
  return {
    id: device.id,
    name,
    watts,
    quantity,
    dutyPercent: duty,
    path: device.path,
    essential: device.essential,
    enabled: device.enabled,
  };
}

function parseNominalWh(form: FormState, errors: FormErrors): number | null {
  if (form.capacityMode === 'wh') {
    const wh = parseNumber(form.whText);
    if (wh === null) errors.capacity = 'Enter the battery energy in watt-hours.';
    else if (wh <= 0) errors.capacity = 'Battery energy must be greater than 0.';
    else return wh;
    return null;
  }
  const volts = parseNumber(form.voltageText);
  const ah = parseNumber(form.ahText);
  if (volts === null || ah === null) {
    errors.capacity = 'Enter both the battery voltage and amp-hours.';
    return null;
  }
  if (volts <= 0 || ah <= 0) {
    errors.capacity = 'Voltage and amp-hours must be greater than 0.';
    return null;
  }
  return energyFromVoltageAh(volts, ah);
}

function parsePercentRange(
  text: string,
  errors: FormErrors,
  field: string,
  message: string,
  isValid: (value: number) => boolean
): number | null {
  const value = parseNumber(text);
  if (value === null || !isValid(value)) {
    errors[field] = message;
    return null;
  }
  return value / 100;
}

export function validateForm(form: FormState): ValidationResult {
  const errors: FormErrors = {};

  const nominalWh = parseNominalWh(form, errors);

  const energyIsUsable = form.usageMode === 'alreadyUsable';
  let usableFraction = 1;
  if (!energyIsUsable) {
    const fraction = parsePercentRange(
      form.usablePercentText,
      errors,
      'usable',
      'Enter a usable share above 0% and up to 100%.',
      (v) => v > 0 && v <= 100
    );
    if (fraction !== null) usableFraction = fraction;
  }

  const reserveFraction = parsePercentRange(
    form.reservePercentText,
    errors,
    'reserve',
    'Enter a reserve from 0% up to (not including) 100%.',
    (v) => v >= 0 && v < 100
  );

  const acEfficiencyFraction = parsePercentRange(
    form.acEfficiencyText,
    errors,
    'acEfficiency',
    'AC efficiency must be above 0% and up to 100%.',
    (v) => v > 0 && v <= 100
  );
  const dcEfficiencyFraction = parsePercentRange(
    form.dcEfficiencyText,
    errors,
    'dcEfficiency',
    'DC efficiency must be above 0% and up to 100%.',
    (v) => v > 0 && v <= 100
  );

  const inverterIdleW = parseNumber(form.inverterIdleText);
  if (inverterIdleW === null || inverterIdleW < 0 || inverterIdleW > 10000) {
    errors.inverterIdle = 'Enter inverter idle draw from 0 W to 10,000 W.';
  }

  let maxAcOutputW: number | null = null;
  if (form.maxAcOutputText.trim() !== '') {
    const limit = parseNumber(form.maxAcOutputText);
    if (limit === null || limit <= 0 || limit > 100000) {
      errors.outputLimit = 'Enter a positive wattage, or leave this blank.';
    } else {
      maxAcOutputW = limit;
    }
  }

  const hours = parseNumber(form.targetHoursText);
  const minutes = parseNumber(form.targetMinutesText);
  let targetHours: number | null = null;
  if (hours === null || !Number.isInteger(hours) || hours < 0 || hours > 999) {
    errors.target = 'Enter whole hours from 0 to 999.';
  } else if (minutes === null || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    errors.target = 'Enter minutes from 0 to 59.';
  } else if (hours + minutes / 60 <= 0) {
    errors.target = 'The target outage must be longer than 0.';
  } else {
    targetHours = hours + minutes / 60;
  }

  const devices: Device[] = [];
  for (const device of form.devices) {
    const parsed = parseDevice(device, errors);
    if (parsed) devices.push(parsed);
  }

  if (
    Object.keys(errors).length > 0 ||
    nominalWh === null ||
    reserveFraction === null ||
    acEfficiencyFraction === null ||
    dcEfficiencyFraction === null ||
    inverterIdleW === null ||
    targetHours === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      nominalWh,
      energyIsUsable,
      usableFraction,
      reserveFraction,
      acEfficiencyFraction,
      dcEfficiencyFraction,
      inverterIdleW,
      maxAcOutputW,
      targetHours,
      devices,
    },
  };
}
