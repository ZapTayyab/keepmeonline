import { Battery } from 'lucide-react';
import type { FormState, CapacityMode, UsageMode } from '@/types/calculator';
import type { FormErrors } from '@/types/calculator';
import { Tooltip } from './Tooltip';
import { CAPACITY_PRESETS } from '@/data/devicePresets';

interface BatteryInputProps {
  form: FormState;
  errors: FormErrors;
  updateForm: (updater: (prev: FormState) => FormState) => void;
}

export function BatteryInput({ form, errors, updateForm }: BatteryInputProps) {
  const setMode = (mode: CapacityMode) =>
    updateForm((prev) => ({ ...prev, capacityMode: mode }));

  const setUsageMode = (mode: UsageMode) =>
    updateForm((prev) => ({ ...prev, usageMode: mode }));

  const applyPreset = (wh?: number, voltage?: number, ah?: number, mode?: CapacityMode) =>
    updateForm((prev) => ({
      ...prev,
      capacityMode: mode ?? prev.capacityMode,
      whText: wh !== undefined ? String(wh) : prev.whText,
      voltageText: voltage !== undefined ? String(voltage) : prev.voltageText,
      ahText: ah !== undefined ? String(ah) : prev.ahText,
    }));

  return (
    <fieldset className="card p-5">
      <legend className="flex items-center gap-2 text-base font-semibold text-navy-900">
        <Battery className="h-5 w-5 text-teal-600" aria-hidden="true" />
        Battery capacity
      </legend>

      <div className="mt-4 flex flex-wrap gap-2">
        {CAPACITY_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.wh, preset.voltage, preset.ah, preset.mode)}
            className="rounded-full border border-navy-900/15 bg-white px-3 py-1 text-xs font-medium text-navy-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('wh')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            form.capacityMode === 'wh'
              ? 'border-teal-500 bg-teal-50 text-teal-700'
              : 'border-navy-900/15 bg-white text-navy-600 hover:bg-cream-100'
          }`}
          aria-pressed={form.capacityMode === 'wh'}
        >
          Watt-hours (Wh)
        </button>
        <button
          type="button"
          onClick={() => setMode('voltAmpHour')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            form.capacityMode === 'voltAmpHour'
              ? 'border-teal-500 bg-teal-50 text-teal-700'
              : 'border-navy-900/15 bg-white text-navy-600 hover:bg-cream-100'
          }`}
          aria-pressed={form.capacityMode === 'voltAmpHour'}
        >
          Volts × Amp-hours
        </button>
      </div>

      {form.capacityMode === 'wh' ? (
        <div className="mt-3">
          <label htmlFor="wh" className="label-text">
            Battery energy
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="wh"
              type="text"
              inputMode="decimal"
              className="input-field"
              value={form.whText}
              onChange={(e) => updateForm((prev) => ({ ...prev, whText: e.target.value }))}
              aria-invalid={!!errors.capacity}
              aria-describedby={errors.capacity ? 'wh-error' : undefined}
            />
            <span className="text-sm text-navy-600">Wh</span>
          </div>
          {errors.capacity && <p id="wh-error" className="error-text">{errors.capacity}</p>}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="voltage" className="label-text">Battery voltage</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="voltage"
                type="text"
                inputMode="decimal"
                className="input-field"
                value={form.voltageText}
                onChange={(e) => updateForm((prev) => ({ ...prev, voltageText: e.target.value }))}
                aria-invalid={!!errors.capacity}
              />
              <span className="text-sm text-navy-600">V</span>
            </div>
          </div>
          <div>
            <label htmlFor="ah" className="label-text">Capacity</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="ah"
                type="text"
                inputMode="decimal"
                className="input-field"
                value={form.ahText}
                onChange={(e) => updateForm((prev) => ({ ...prev, ahText: e.target.value }))}
                aria-invalid={!!errors.capacity}
              />
              <span className="text-sm text-navy-600">Ah</span>
            </div>
          </div>
          {errors.capacity && (
            <p className="error-text col-span-2" id="va-error">{errors.capacity}</p>
          )}
        </div>
      )}

      <p className="help-text">
        Use the battery&rsquo;s nominal voltage and capacity&mdash;not the inverter&rsquo;s AC output voltage.
      </p>

      {/* Usable share */}
      <div className="mt-5 border-t border-navy-900/10 pt-4">
        <div className="flex items-center gap-1.5">
          <span className="label-text">Usable share of battery capacity</span>
          <Tooltip
            label="About usable battery share"
            content="This estimate is not a recommendation for how deeply to discharge your battery. Use the battery manufacturer's limits."
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="usable"
            type="text"
            inputMode="decimal"
            className="input-field"
            value={form.usablePercentText}
            disabled={form.usageMode === 'alreadyUsable'}
            onChange={(e) => updateForm((prev) => ({ ...prev, usablePercentText: e.target.value }))}
            aria-invalid={!!errors.usable}
            aria-describedby={errors.usable ? 'usable-error' : undefined}
          />
          <span className="text-sm text-navy-600">%</span>
        </div>
        {errors.usable && <p id="usable-error" className="error-text">{errors.usable}</p>}
        <p className="help-text">
          Default 80% is an editable example assumption. Lithium, lead-acid, and UPS batteries differ.
        </p>

        <label className="mt-3 flex items-start gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-navy-900/30 text-teal-600"
            checked={form.usageMode === 'alreadyUsable'}
            onChange={(e) => setUsageMode(e.target.checked ? 'alreadyUsable' : 'percent')}
          />
          <span>
            My Wh value already represents usable battery energy.
            <span className="block text-xs text-navy-600/80">
              When enabled, we skip the usable-share step. The entered energy must be battery-side usable energy before output-conversion losses.
            </span>
          </span>
        </label>
      </div>

      {/* Reserve */}
      <div className="mt-5 border-t border-navy-900/10 pt-4">
        <div className="flex items-center gap-1.5">
          <span className="label-text">Keep this share of usable energy in reserve</span>
          <Tooltip
            label="About reserve"
            content="This is an additional planning reserve applied after the usable-capacity setting. It reduces the energy available for your estimate."
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="reserve"
            type="text"
            inputMode="decimal"
            className="input-field"
            value={form.reservePercentText}
            onChange={(e) => updateForm((prev) => ({ ...prev, reservePercentText: e.target.value }))}
            aria-invalid={!!errors.reserve}
            aria-describedby={errors.reserve ? 'reserve-error' : undefined}
          />
          <span className="text-sm text-navy-600">%</span>
        </div>
        {errors.reserve && <p id="reserve-error" className="error-text">{errors.reserve}</p>}
        <p className="help-text">Default 10%. This is separate from the usable-capacity setting above.</p>
      </div>
    </fieldset>
  );
}
