import { Plus, Copy, Trash2, RotateCcw, Plug } from 'lucide-react';
import type { FormState, DeviceForm, PowerPath } from '@/types/calculator';
import type { FormErrors } from '@/types/calculator';
import {
  DEVICE_PRESETS,
  type DevicePreset,
} from '@/data/devicePresets';
import {
  MAX_DEVICES,
  MAX_NAME_LENGTH,
  createCustomDeviceForm,
  deviceFormFromPreset,
  duplicateDeviceForm,
} from '@/lib/formState';
import { Tooltip } from './Tooltip';

interface DeviceBuilderProps {
  form: FormState;
  errors: FormErrors;
  updateForm: (updater: (prev: FormState) => FormState) => void;
}

function updateDevice(
  form: FormState,
  id: string,
  patch: Partial<DeviceForm>
): FormState {
  return {
    ...form,
    devices: form.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  };
}

export function DeviceBuilder({ form, errors, updateForm }: DeviceBuilderProps) {
  const addDevice = (preset?: DevicePreset) => {
    if (form.devices.length >= MAX_DEVICES) return;
    const device = preset ? deviceFormFromPreset(preset) : createCustomDeviceForm();
    updateForm((prev) => ({ ...prev, devices: [...prev.devices, device] }));
  };

  const duplicate = (device: DeviceForm) => {
    if (form.devices.length >= MAX_DEVICES) return;
    updateForm((prev) => ({ ...prev, devices: [...prev.devices, duplicateDeviceForm(device)] }));
  };

  const remove = (id: string) => {
    updateForm((prev) => ({ ...prev, devices: prev.devices.filter((d) => d.id !== id) }));
  };

  const reset = () => {
    updateForm((prev) => ({ ...prev, devices: DEVICE_PRESETS.map(deviceFormFromPreset) }));
  };

  return (
    <fieldset className="card p-5">
      <div className="flex items-center justify-between">
        <legend className="flex items-center gap-2 text-base font-semibold text-navy-900">
          <Plug className="h-5 w-5 text-teal-600" aria-hidden="true" />
          Devices
        </legend>
        <button
          type="button"
          onClick={reset}
          className="btn-ghost text-xs"
          aria-label="Reset devices to defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
        </button>
      </div>

      <p className="help-text mt-2">
        Example wattages are not measurements. Check your equipment label or use a power meter. Adapter ratings often describe a maximum, not actual consumption.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DEVICE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => addDevice(preset)}
            className="rounded-full border border-navy-900/15 bg-white px-3 py-1 text-xs font-medium text-navy-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            + {preset.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => addDevice()}
          className="rounded-full border border-teal-500 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
        >
          + Custom
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {form.devices.length === 0 && (
          <p className="text-sm text-navy-600 py-2">No devices yet. Add one above.</p>
        )}
        {form.devices.map((device) => (
          <DeviceRow
            key={device.id}
            device={device}
            errors={errors}
            updateForm={updateForm}
            onDuplicate={() => duplicate(device)}
            onRemove={() => remove(device.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-navy-900/10 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-navy-700">Duty percentage</span>
          <Tooltip
            label="About duty percentage"
            content="The share of time the device draws the entered power. Leave at 100% if unsure. This is a steady-average-load estimate, not an electrical design tool."
          />
        </div>
        <span className="text-xs text-navy-600/70">{form.devices.length}/{MAX_DEVICES}</span>
      </div>
    </fieldset>
  );
}

interface DeviceRowProps {
  device: DeviceForm;
  errors: FormErrors;
  updateForm: (updater: (prev: FormState) => FormState) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function DeviceRow({ device, errors, updateForm, onDuplicate, onRemove }: DeviceRowProps) {
  const e = (field: string) => errors[`device:${device.id}:${field}`];
  const patch = (p: Partial<DeviceForm>) =>
    updateForm((prev) => updateDevice(prev, device.id, p));

  return (
    <div
      className={`rounded-lg border p-3 transition ${
        device.enabled ? 'border-navy-900/10 bg-white' : 'border-navy-900/5 bg-cream-100/50 opacity-70'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-navy-900/30 text-teal-600 focus:ring-teal-500"
            checked={device.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            aria-label={`Enable ${device.name}`}
          />
          <input
            type="text"
            className="input-field flex-1 !py-1.5 !text-sm"
            value={device.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => patch({ name: e.target.value })}
            aria-label="Device name"
            aria-invalid={!!e('name')}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1 text-xs text-navy-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-navy-900/30 text-teal-600 focus:ring-teal-500"
              checked={device.essential}
              onChange={(e) => patch({ essential: e.target.checked })}
            />
            Essential
          </label>
          <button
            type="button"
            onClick={onDuplicate}
            className="btn-ghost !p-1.5 text-xs text-navy-600 hover:text-navy-900"
            aria-label={`Duplicate ${device.name}`}
            title="Duplicate device"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="btn-ghost !p-1.5 text-xs text-error-600 hover:bg-error-500/10 hover:text-error-700"
            aria-label={`Remove ${device.name}`}
            title="Remove device"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="text-[11px] font-medium text-navy-600">Watts</label>
          <input
            type="text"
            inputMode="decimal"
            className="input-field !py-1.5 !text-sm"
            value={device.wattsText}
            onChange={(e) => patch({ wattsText: e.target.value })}
            aria-invalid={!!e('watts')}
          />
          {e('watts') && <p className="error-text">{e('watts')}</p>}
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-600">Qty</label>
          <input
            type="text"
            inputMode="numeric"
            className="input-field !py-1.5 !text-sm"
            value={device.quantityText}
            onChange={(e) => patch({ quantityText: e.target.value })}
            aria-invalid={!!e('quantity')}
          />
          {e('quantity') && <p className="error-text">{e('quantity')}</p>}
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-600">Duty %</label>
          <input
            type="text"
            inputMode="decimal"
            className="input-field !py-1.5 !text-sm"
            value={device.dutyText}
            onChange={(e) => patch({ dutyText: e.target.value })}
            aria-invalid={!!e('duty')}
          />
          {e('duty') && <p className="error-text">{e('duty')}</p>}
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-600">Power Path</label>
          <select
            className="input-field !py-1.5 !text-sm"
            value={device.path}
            onChange={(e) => patch({ path: e.target.value as PowerPath })}
          >
            <option value="ac">AC (Inverter)</option>
            <option value="dc">DC (Direct)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
