import { calculateRuntime } from '@/lib/calculations';
import type { CalculationInput, CalculationResult, Device } from '@/types/calculator';

const EXAMPLE_ASSUMPTIONS: Omit<CalculationInput, 'devices'> = {
  nominalWh: 500,
  energyIsUsable: false,
  usableFraction: 0.8,
  reserveFraction: 0.1,
  acEfficiencyFraction: 0.85,
  dcEfficiencyFraction: 0.95,
  inverterIdleW: 0,
  maxAcOutputW: null,
  targetHours: 4,
};

function acDevice(id: string, name: string, watts: number, essential: boolean): Device {
  return { id, name, watts, quantity: 1, dutyPercent: 100, path: 'ac', essential, enabled: true };
}

export interface WorkedExample {
  id: string;
  title: string;
  description: string;
  input: CalculationInput;
  result: CalculationResult;
}

function buildExample(
  id: string,
  title: string,
  description: string,
  devices: Device[]
): WorkedExample {
  const input: CalculationInput = { ...EXAMPLE_ASSUMPTIONS, devices };
  return { id, title, description, input, result: calculateRuntime(input) };
}

export const WORKED_EXAMPLES: WorkedExample[] = [
  buildExample(
    'router-ont',
    'Example 1: Router plus fiber ONT',
    'A 500 Wh battery powering only the internet equipment, with the default 80% usable share and 10% reserve.',
    [
      acDevice('router', 'Wi-Fi router', 10, true),
      acDevice('ont', 'Fiber ONT/modem', 8, true),
    ]
  ),
  buildExample(
    'router-ont-laptop',
    'Example 2: Router, ONT, and laptop',
    'The same battery with a 45 W laptop added. The laptop draw is the largest factor in the shorter runtime.',
    [
      acDevice('router', 'Wi-Fi router', 10, true),
      acDevice('ont', 'Fiber ONT/modem', 8, true),
      acDevice('laptop', 'Laptop', 45, false),
    ]
  ),
];
