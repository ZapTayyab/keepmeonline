export type PowerPath = 'ac' | 'dc';
export type CapacityMode = 'wh' | 'voltAmpHour';
export type UsageMode = 'percent' | 'alreadyUsable';
export type TargetStatus = 'meets' | 'close' | 'shortfall' | 'no-load' | 'invalid';

export interface Device {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  dutyPercent: number;
  path: PowerPath;
  essential: boolean;
  enabled: boolean;
}

export interface CalculationInput {
  nominalWh: number;
  energyIsUsable: boolean;
  usableFraction: number;
  reserveFraction: number;
  acEfficiencyFraction: number;
  dcEfficiencyFraction: number;
  inverterIdleW: number;
  maxAcOutputW: number | null;
  targetHours: number;
  devices: Device[];
}

export interface CalculationResult {
  status: TargetStatus;
  input: CalculationInput;
  nominalWh: number;
  usableWh: number;
  planningWh: number;
  acLoadW: number;
  dcLoadW: number;
  acNameplateW: number;
  idleW: number;
  batteryDrawW: number;
  runtimeHours: number | null;
  differenceHours: number | null;
  requiredUsableWh: number | null;
  requiredNominalWh: number | null;
  outputLimitExceeded: boolean;
}

export interface DeviceForm {
  id: string;
  name: string;
  wattsText: string;
  quantityText: string;
  dutyText: string;
  path: PowerPath;
  essential: boolean;
  enabled: boolean;
}

export interface FormState {
  capacityMode: CapacityMode;
  whText: string;
  voltageText: string;
  ahText: string;
  usageMode: UsageMode;
  usablePercentText: string;
  reservePercentText: string;
  acEfficiencyText: string;
  dcEfficiencyText: string;
  inverterIdleText: string;
  maxAcOutputText: string;
  targetHoursText: string;
  targetMinutesText: string;
  devices: DeviceForm[];
}

export type FormErrors = Record<string, string>;
