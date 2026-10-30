import { useState } from 'react';
import { ChevronDown, TrendingUp, PowerOff } from 'lucide-react';
import type { CalculationInput } from '@/types/calculator';
import { buildScenarios, type ScenarioSet } from '@/lib/scenarios';
import { ResultCard } from './ResultCard';
import { formatDuration } from '@/lib/formatting';

interface ScenarioComparisonProps {
  input: CalculationInput;
}

type Tab = 'current' | 'essentials' | 'suggested';

export function ScenarioComparison({ input }: ScenarioComparisonProps) {
  const [tab, setTab] = useState<Tab>('current');
  const scenarios: ScenarioSet = buildScenarios(input);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'current', label: 'Current setup' },
    { key: 'essentials', label: 'Essential only' },
    { key: 'suggested', label: 'Suggested changes' },
  ];

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-navy-900">Compare scenarios</h3>

      <div className="mt-3 flex gap-1 rounded-lg bg-cream-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900'
            }`}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'current' && <ResultCard result={scenarios.current} />}

        {tab === 'essentials' && (
          <div>
            <ResultCard result={scenarios.essentials} />
            {scenarios.essentialCount === 0 && (
              <p className="mt-3 text-sm text-navy-600">
                No essential devices are selected. Mark devices as essential to see this scenario.
              </p>
            )}
          </div>
        )}

        {tab === 'suggested' && (
          <div>
            <SuggestedChanges scenarios={scenarios} />
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestedChanges({ scenarios }: { scenarios: ScenarioSet }) {
  const { current, suggestions } = scenarios;

  if (current.status === 'meets') {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-sm text-teal-800">
          Your current setup already meets the target. The suggestions below are optional ways to increase your buffer.
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    if (scenarios.essentialCount === 0 || current.batteryDrawW <= 0) {
      return (
        <p className="text-sm text-navy-600">
          {current.batteryDrawW <= 0
            ? 'Add or enable a device to see suggestions.'
            : 'All enabled devices are marked essential. There are no nonessential devices to switch off.'}
        </p>
      );
    }
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          Removing nonessential devices is not enough under the current assumptions. Consider a larger battery or a longer target.
        </p>
        {current.requiredUsableWh !== null && (
          <p className="mt-2 text-xs text-amber-600">
            Required usable energy for your target: {Math.round(current.requiredUsableWh)} Wh (before reserve).
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((suggestion) => (
        <li
          key={suggestion.device.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-navy-900/10 bg-white p-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <PowerOff className="h-4 w-4 text-navy-600/60" aria-hidden="true" />
            <span className="font-medium text-navy-900">{suggestion.device.name}</span>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-1 font-medium text-teal-700">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {suggestion.improvementHours !== null
                ? `+${formatDuration(suggestion.improvementHours)}`
                : '—'}
            </div>
            <div className="text-xs text-navy-600">
              saves {Math.round(suggestion.batteryDrawSavedW)} W draw
            </div>
          </div>
        </li>
      ))}
      <li className="pt-1">
        <ResultCard result={suggestions[suggestions.length - 1].result} />
      </li>
    </ul>
  );
}
