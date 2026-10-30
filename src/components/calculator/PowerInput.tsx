import { Cable, Zap } from 'lucide-react';
import type { FormState, FormErrors } from '@/types/calculator';
import { Tooltip } from './Tooltip';

interface PowerInputProps {
  form: FormState;
  errors: FormErrors;
  updateForm: (updater: (prev: FormState) => FormState) => void;
}

export function PowerInput({ form, errors, updateForm }: PowerInputProps) {
  return (
    <fieldset className="card p-5">
      <legend className="flex items-center gap-2 text-base font-semibold text-navy-900">
        <Cable className="h-5 w-5 text-teal-600" aria-hidden="true" />
        Power delivery &amp; efficiency
      </legend>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="acEff" className="label-text">AC efficiency</label>
            <Tooltip
              label="About AC efficiency"
              content="The share of battery energy that reaches AC devices after inverter conversion losses. Default 85% is an editable example, not a spec."
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="acEff"
              type="text"
              inputMode="decimal"
              className="input-field"
              value={form.acEfficiencyText}
              onChange={(e) => updateForm((prev) => ({ ...prev, acEfficiencyText: e.target.value }))}
              aria-invalid={!!errors.acEfficiency}
            />
            <span className="text-sm text-navy-600">%</span>
          </div>
          {errors.acEfficiency && <p className="error-text">{errors.acEfficiency}</p>}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="dcEff" className="label-text">DC efficiency</label>
            <Tooltip
              label="About DC efficiency"
              content="The share of battery energy that reaches DC devices after any DC conversion. Default 95% is an editable example."
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="dcEff"
              type="text"
              inputMode="decimal"
              className="input-field"
              value={form.dcEfficiencyText}
              onChange={(e) => updateForm((prev) => ({ ...prev, dcEfficiencyText: e.target.value }))}
              aria-invalid={!!errors.dcEfficiency}
            />
            <span className="text-sm text-navy-600">%</span>
          </div>
          {errors.dcEfficiency && <p className="error-text">{errors.dcEfficiency}</p>}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1.5">
          <label htmlFor="idle" className="label-text">Inverter idle draw</label>
          <Tooltip
            label="About inverter idle draw"
            content="Power the inverter consumes just by being switched on, even with no load. Only applied when at least one enabled AC device has a positive load."
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="idle"
            type="text"
            inputMode="decimal"
            className="input-field"
            value={form.inverterIdleText}
            onChange={(e) => updateForm((prev) => ({ ...prev, inverterIdleText: e.target.value }))}
            aria-invalid={!!errors.inverterIdle}
          />
          <span className="text-sm text-navy-600">W</span>
        </div>
        {errors.inverterIdle && <p className="error-text">{errors.inverterIdle}</p>}
        <p className="help-text">
          <Zap className="inline h-3 w-3" aria-hidden="true" /> Default 0 W. Not included in your estimate until you enter a value.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="maxAc" className="label-text">
          Maximum continuous AC output <span className="text-navy-600/60 font-normal">(optional)</span>
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="maxAc"
            type="text"
            inputMode="decimal"
            className="input-field"
            placeholder="e.g. 300"
            value={form.maxAcOutputText}
            onChange={(e) => updateForm((prev) => ({ ...prev, maxAcOutputText: e.target.value }))}
            aria-invalid={!!errors.outputLimit}
          />
          <span className="text-sm text-navy-600">W</span>
        </div>
        {errors.outputLimit && <p className="error-text">{errors.outputLimit}</p>}
        <p className="help-text">
          We compare this against the nameplate watts of your enabled AC devices. Passing the check does not establish startup-surge compatibility.
        </p>
      </div>
    </fieldset>
  );
}
