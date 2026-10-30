import type { PowerPath } from '@/types/calculator';

export interface DevicePreset {
  name: string;
  watts: number;
  quantity: number;
  dutyPercent: number;
  path: PowerPath;
  essential: boolean;
  enabled: boolean;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { name: 'Wi-Fi router', watts: 10, quantity: 1, dutyPercent: 100, path: 'ac', essential: true, enabled: true },
  { name: 'Fiber ONT/modem', watts: 8, quantity: 1, dutyPercent: 100, path: 'ac', essential: true, enabled: true },
  { name: 'Laptop', watts: 45, quantity: 1, dutyPercent: 100, path: 'ac', essential: false, enabled: true },
  { name: 'Monitor', watts: 25, quantity: 1, dutyPercent: 100, path: 'ac', essential: false, enabled: false },
  { name: 'LED light', watts: 9, quantity: 1, dutyPercent: 100, path: 'ac', essential: false, enabled: false },
  { name: 'Fan', watts: 45, quantity: 1, dutyPercent: 100, path: 'ac', essential: false, enabled: false },
  { name: 'Phone charger', watts: 10, quantity: 1, dutyPercent: 100, path: 'ac', essential: false, enabled: false },
];

export interface CapacityPreset {
  label: string;
  mode: 'wh' | 'voltAmpHour';
  wh?: number;
  voltage?: number;
  ah?: number;
}

export const CAPACITY_PRESETS: CapacityPreset[] = [
  { label: '300 Wh', mode: 'wh', wh: 300 },
  { label: '500 Wh', mode: 'wh', wh: 500 },
  { label: '1,000 Wh', mode: 'wh', wh: 1000 },
  { label: '12 V × 100 Ah', mode: 'voltAmpHour', voltage: 12, ah: 100 },
];

export const TARGET_SHORTCUTS = [1, 2, 4, 8];
