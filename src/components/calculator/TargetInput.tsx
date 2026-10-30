import { Clock } from 'lucide-react';
import type { FormState, FormErrors } from '@/types/calculator';
import { TARGET_SHORTCUTS } from '@/data/devicePresets';

interface TargetInputProps {
  form: FormState;
  errors: FormErrors;
  updateForm: (updater: (prev: FormState) => FormState) => void;
}

export function TargetInput({ form, errors, updateForm }: TargetInputProps) {
  const setShortcut = (hours: number) =>
    updateForm((prev) => ({ ...prev, targetHoursText: String(hours), targetMinutesText: '0' }));

  return (
    <fieldset className="card p-5">
      <legend className="flex items-center gap-2 text-base font-semibold text-navy-900">
        <Clock className="h-5 w-5 text-teal-600" aria-hidden="true" />
        Target outage duration
      </legend>

      <div className="mt-4 flex flex-wrap gap-2">
        {TARGET_SHORTCUTS.map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => setShortcut(hours)}
            className="rounded-full border border-navy-900/15 bg-white px-3 py-1 text-xs font-medium text-navy-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            {hours} hour{hours > 1 ? 's' : ''}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="targetH" className="label-text">Hours</label>
          <input
            id="targetH"
            type="text"
            inputMode="numeric"
            className="input-field mt-1"
            value={form.targetHoursText}
            onChange={(e) => updateForm((prev) => ({ ...prev, targetHoursText: e.target.value }))}
            aria-invalid={!!errors.target}
          />
        </div>
        <div>
          <label htmlFor="targetM" className="label-text">Minutes</label>
          <input
            id="targetM"
            type="text"
            inputMode="numeric"
            className="input-field mt-1"
            value={form.targetMinutesText}
            onChange={(e) => updateForm((prev) => ({ ...prev, targetMinutesText: e.target.value }))}
            aria-invalid={!!errors.target}
          />
        </div>
      </div>
      {errors.target && (
        <p className="error-text" id="target-error">{errors.target}</p>
      )}
    </fieldset>
  );
}
