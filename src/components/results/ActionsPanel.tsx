import { useState } from 'react';
import { ChevronDown, Copy, Printer, Share2 } from 'lucide-react';
import type { CalculationResult, CalculationInput } from '@/types/calculator';
import type { FormState } from '@/types/calculator';
import { buildShareUrl } from '@/lib/sharing';
import { copyText } from '@/lib/clipboard';
import { buildResultSummary } from '@/lib/summary';
import { buildScenarios } from '@/lib/scenarios';
import { formatDuration, formatWatts, formatWh, formatPercent } from '@/lib/formatting';

interface ActionsPanelProps {
  form: FormState;
  input: CalculationInput;
  result: CalculationResult;
}

export function ActionsPanel({ form, input, result }: ActionsPanelProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);

  const handleShareLink = async () => {
    const url = buildShareUrl(form);
    const ok = await copyText(url);
    setShareFeedback(ok ? 'Share link copied to clipboard.' : 'Could not copy automatically. Copy the link from your address bar.');
    setTimeout(() => setShareFeedback(null), 4000);
  };

  const handleCopySummary = async () => {
    const scenarios = buildScenarios(input);
    const summary = buildResultSummary(scenarios);
    const ok = await copyText(summary);
    setShareFeedback(ok ? 'Result summary copied.' : 'Could not copy automatically.');
    setTimeout(() => setShareFeedback(null), 4000);
  };

  return (
    <div className="no-print space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleShareLink} className="btn-secondary text-sm">
          <Share2 className="h-4 w-4" aria-hidden="true" /> Copy share link
        </button>
        <button type="button" onClick={handleCopySummary} className="btn-secondary text-sm">
          <Copy className="h-4 w-4" aria-hidden="true" /> Copy summary
        </button>
        <button type="button" onClick={() => window.print()} className="btn-secondary text-sm">
          <Printer className="h-4 w-4" aria-hidden="true" /> Print summary
        </button>
      </div>

      {shareFeedback && (
        <p className="text-xs text-teal-700 animate-fade-in" role="status">{shareFeedback}</p>
      )}

      <p className="text-xs text-navy-600/70">
        Anyone receiving a share link can read your configuration. Share links store settings in the link, not on a server.
      </p>

      <button
        type="button"
        onClick={() => setShowCalc((v) => !v)}
        className="btn-ghost w-full justify-between rounded-lg border border-navy-900/10 px-3 py-2 text-sm"
        aria-expanded={showCalc}
      >
        <span>Show my calculation</span>
        <ChevronDown className={`h-4 w-4 transition ${showCalc ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {showCalc && <CalculationBreakdown input={input} result={result} />}
    </div>
  );
}

function CalculationBreakdown({
  input,
  result,
}: {
  input: CalculationInput;
  result: CalculationResult;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Input capacity', value: formatWh(input.nominalWh) },
    {
      label: 'Usable fraction',
      value: input.energyIsUsable ? 'Already usable (skipped)' : formatPercent(input.usableFraction),
    },
    { label: 'Reserve', value: formatPercent(input.reserveFraction) },
    { label: 'AC load', value: formatWatts(result.acLoadW) },
    { label: 'DC load', value: formatWatts(result.dcLoadW) },
    { label: 'AC conversion efficiency', value: formatPercent(input.acEfficiencyFraction) },
    { label: 'DC conversion efficiency', value: formatPercent(input.dcEfficiencyFraction) },
    { label: 'Inverter idle draw', value: result.idleW > 0 ? formatWatts(result.idleW) : '0 W (none applied)' },
    { label: 'Battery-side draw', value: formatWatts(result.batteryDrawW) },
    { label: 'Planning energy', value: formatWh(result.planningWh) },
  ];

  return (
    <div className="rounded-lg border border-navy-900/10 bg-cream-50 p-4 animate-slide-up">
      <dl className="space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-navy-600">{row.label}</dt>
            <dd className="font-mono text-navy-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 border-t border-navy-900/10 pt-3">
        <p className="font-mono text-xs text-navy-700">
          runtime = planning energy ÷ battery-side draw
        </p>
        <p className="mt-1 font-mono text-xs text-navy-900">
          {result.runtimeHours !== null
            ? `${formatWh(result.planningWh)} ÷ ${formatWatts(result.batteryDrawW)} = ${formatDuration(result.runtimeHours)}`
            : 'No load to estimate.'}
        </p>
      </div>
    </div>
  );
}
