import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CalculationInput } from '@/types/calculator';
import { createDefaultForm, sanitizeForm } from '@/lib/formState';
import { clearSavedForm, loadSavedForm, saveForm } from '@/lib/storage';
import { readShareHash, type ShareReadResult } from '@/lib/sharing';
import { validateForm, type ValidationResult } from '@/lib/validation';
import type { FormState } from '@/types/calculator';

export interface CalculatorState {
  form: FormState;
  validation: ValidationResult;
  input: CalculationInput | null;
  shareResult: ShareReadResult | null;
  storageError: boolean;
  updateForm: (updater: (prev: FormState) => FormState) => void;
  resetForm: () => void;
  importForm: (incoming: FormState) => void;
  clearSaved: () => void;
}

const SAVE_DEBOUNCE_MS = 400;

function resolveInitialForm(): { form: FormState; shareResult: ShareReadResult | null } {
  const share = readShareHash(window.location.hash);
  if (share.kind === 'ok') {
    return { form: share.form, shareResult: share };
  }
  const saved = loadSavedForm();
  if (saved) return { form: saved, shareResult: null };
  return { form: createDefaultForm(), shareResult: null };
}

function computeValidation(form: FormState): ValidationResult {
  return validateForm(form);
}

export function useCalculatorState() {
  const initial = useMemo(resolveInitialForm, []);
  const [form, setForm] = useState<FormState>(initial.form);
  const [shareResult] = useState<ShareReadResult | null>(initial.shareResult);
  const [storageError, setStorageError] = useState(false);

  const validation = useMemo(() => computeValidation(form), [form]);
  const input = validation.ok ? validation.input : null;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        saveForm(form);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form]);

  const updateForm = useCallback((updater: (prev: FormState) => FormState) => {
    setForm(updater);
  }, []);

  const resetForm = useCallback(() => {
    setForm(createDefaultForm());
  }, []);

  const importForm = useCallback((incoming: FormState) => {
    setForm(incoming);
  }, []);

  const clearSaved = useCallback(() => {
    try {
      clearSavedForm();
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, []);

  return {
    form,
    validation,
    input,
    shareResult,
    storageError,
    updateForm,
    resetForm,
    importForm,
    clearSaved,
  };
}
