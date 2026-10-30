import { useRef } from 'react';
import { AlertTriangle, Trash2, ArrowDown } from 'lucide-react';
import type { CalculatorState } from '@/lib/useCalculatorState';
import { calculateRuntime } from '@/lib/calculations';
import { BatteryInput } from './BatteryInput';
import { PowerInput } from './PowerInput';
import { TargetInput } from './TargetInput';
import { DeviceBuilder } from './DeviceBuilder';
import { ResultCard } from '@/components/results/ResultCard';
import { ScenarioComparison } from '@/components/results/ScenarioComparison';
import { ActionsPanel } from '@/components/results/ActionsPanel';

interface CalculatorPanelProps {
  state: CalculatorState;
  resultsRef: React.RefObject<HTMLDivElement>;
}

export function CalculatorPanel({ state, resultsRef }: CalculatorPanelProps) {
  const {
    form,
    validation,
    input,
    shareResult,
    storageError,
    updateForm,
    resetForm,
    clearSaved,
  } = state;

  const errors = validation.ok ? {} : validation.errors;
  const result = input ? calculateRuntime(input) : null;

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {shareResult?.kind === 'error' && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {shareResult.message}
          </div>
        </div>
      )}

      {shareResult?.kind === 'ok' && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
            Loaded a shared configuration. Your changes will replace it.
          </div>
        </div>
      )}

      {storageError && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Could not save settings to this browser. The calculator still works for this session.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          {/* Inputs column */}
          <div className="space-y-4">
            <BatteryInput form={form} errors={errors} updateForm={updateForm} />
            <PowerInput form={form} errors={errors} updateForm={updateForm} />
            <TargetInput form={form} errors={errors} updateForm={updateForm} />
            <DeviceBuilder form={form} errors={errors} updateForm={updateForm} />

            <div className="flex flex-wrap gap-2 pt-2 no-print">
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear all inputs
              </button>
              <button type="button" onClick={clearSaved} className="btn-ghost text-sm">
                Clear saved settings
              </button>
            </div>

            <button
              type="button"
              onClick={scrollToResults}
              className="btn-primary w-full lg:hidden no-print"
            >
              View results
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Results column — sticky on desktop */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4" ref={resultsRef}>
            {result ? (
              <>
                <ResultCard result={result} />
                <ActionsPanel form={form} input={input!} result={result} />
                <ScenarioComparison input={input!} />
              </>
            ) : (
              <div className="card p-5">
                <p className="text-sm text-navy-600">
                  Fix the highlighted fields to see your estimate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
