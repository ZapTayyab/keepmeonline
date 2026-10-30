import { createDefaultForm, sanitizeForm, withoutDeviceIds } from '@/lib/formState';
import type { FormState } from '@/types/calculator';

const STORAGE_KEY = 'keep-me-online:settings';
const STORAGE_VERSION = 1;

function serialize(form: FormState): string {
  return JSON.stringify(withoutDeviceIds(form));
}

export function isDefaultForm(form: FormState): boolean {
  return serialize(form) === serialize(createDefaultForm());
}

export function loadSavedForm(): FormState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if ((parsed as { version?: unknown }).version !== STORAGE_VERSION) return null;
    return sanitizeForm((parsed as { form?: unknown }).form);
  } catch {
    return null;
  }
}

export function saveForm(form: FormState): void {
  try {
    if (isDefaultForm(form)) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, form: withoutDeviceIds(form) })
      );
    }
  } catch {
    // Storage can be blocked or full; the calculator keeps working without saving.
  }
}

export function clearSavedForm(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
