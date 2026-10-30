import type { CalculationInput, CalculationResult, Device } from '@/types/calculator';

export const CLOSE_THRESHOLD = 0.9;

export function energyFromVoltageAh(voltageV: number, capacityAh: number): number {
  return voltageV * capacityAh;
}

export function averageDeviceWatts(device: Device): number {
  return (device.watts * device.quantity * device.dutyPercent) / 100;
}

export function summarizeLoads(devices: Device[]) {
  let acLoadW = 0;
  let dcLoadW = 0;
  let acNameplateW = 0;
  for (const device of devices) {
    if (!device.enabled) continue;
    if (device.path === 'ac') {
      acLoadW += averageDeviceWatts(device);
      acNameplateW += device.watts * device.quantity;
    } else {
      dcLoadW += averageDeviceWatts(device);
    }
  }
  return { acLoadW, dcLoadW, acNameplateW };
}

function invalidResult(input: CalculationInput): CalculationResult {
  return {
    status: 'invalid',
    input,
    nominalWh: input.nominalWh,
    usableWh: 0,
    planningWh: 0,
    acLoadW: 0,
    dcLoadW: 0,
    acNameplateW: 0,
    idleW: 0,
    batteryDrawW: 0,
    runtimeHours: null,
    differenceHours: null,
    requiredUsableWh: null,
    requiredNominalWh: null,
    outputLimitExceeded: false,
  };
}

export function calculateRuntime(input: CalculationInput): CalculationResult {
  const { acLoadW, dcLoadW, acNameplateW } = summarizeLoads(input.devices);
  const usableWh = input.energyIsUsable
    ? input.nominalWh
    : input.nominalWh * input.usableFraction;
  const planningWh = usableWh * (1 - input.reserveFraction);
  const idleW = acLoadW > 0 ? input.inverterIdleW : 0;
  const batteryDrawW =
    acLoadW / input.acEfficiencyFraction + dcLoadW / input.dcEfficiencyFraction + idleW;
  const outputLimitExceeded = input.maxAcOutputW !== null && acNameplateW > input.maxAcOutputW;

  const finiteValues = [usableWh, planningWh, batteryDrawW];
  if (!finiteValues.every(Number.isFinite)) {
    return invalidResult(input);
  }

  const base = {
    input,
    nominalWh: input.nominalWh,
    usableWh,
    planningWh,
    acLoadW,
    dcLoadW,
    acNameplateW,
    idleW,
    batteryDrawW,
    outputLimitExceeded,
  };

  if (batteryDrawW <= 0) {
    return {
      ...base,
      status: 'no-load',
      runtimeHours: null,
      differenceHours: null,
      requiredUsableWh: null,
      requiredNominalWh: null,
    };
  }

  const runtimeHours = planningWh / batteryDrawW;
  const requiredUsableWh = (batteryDrawW * input.targetHours) / (1 - input.reserveFraction);
  const requiredNominalWh = input.energyIsUsable
    ? null
    : requiredUsableWh / input.usableFraction;

  let status: CalculationResult['status'];
  if (runtimeHours >= input.targetHours) status = 'meets';
  else if (runtimeHours >= input.targetHours * CLOSE_THRESHOLD) status = 'close';
  else status = 'shortfall';

  return {
    ...base,
    status,
    runtimeHours,
    differenceHours: runtimeHours - input.targetHours,
    requiredUsableWh,
    requiredNominalWh,
  };
}
