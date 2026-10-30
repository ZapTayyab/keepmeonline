import { CheckCircle2, AlertTriangle, TriangleAlert, Clock, Gauge, Battery } from 'lucide-react';
import type { CalculationResult } from '@/types/calculator';
import { describeRuntime, describeStatus } from '@/lib/summary';
import { formatDuration, formatSignedDuration, formatWatts, formatWh } from '@/lib/formatting';

interface ResultCardProps {
  result: CalculationResult;
}

const STATUS_CONFIG = {
  meets: {
    icon: CheckCircle2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  close: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  shortfall: {
    icon: TriangleAlert,
    color: 'text-error-600',
    bg: 'bg-error-500/5',
    border: 'border-error-500/20',
  },
  'no-load': {
    icon: Gauge,
    color: 'text-navy-600',
    bg: 'bg-cream-100',
    border: 'border-navy-900/10',
  },
  invalid: {
    icon: AlertTriangle,
    color: 'text-error-600',
    bg: 'bg-error-500/5',
    border: 'border-error-500/20',
  },
} as const;

export function ResultCard({ result }: ResultCardProps) {
  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.color}`} aria-hidden="true" />
        <span className={`text-sm font-semibold ${config.color}`}>{describeStatus(result.status)}</span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-navy-600/70">Estimated runtime</p>
        <p className="mt-1 text-3xl font-bold text-navy-900">
          {describeRuntime(result)}
        </p>
      </div>

      {result.status === 'no-load' && (
        <p className="mt-2 text-sm text-navy-600">
          Add or enable a device to estimate runtime.
        </p>
      )}

      {result.differenceHours !== null && result.status !== 'no-load' && (
        <p className="mt-2 text-sm text-navy-700">
          {result.differenceHours >= 0 ? (
            <>Estimated surplus: <span className="font-semibold text-teal-700">{formatSignedDuration(result.differenceHours)}</span></>
          ) : (
            <>Estimated shortfall: <span className="font-semibold text-error-600">{formatSignedDuration(result.differenceHours)}</span></>
          )}
          <span className="text-navy-600/70"> vs target {formatDuration(result.input.targetHours)}</span>
        </p>
      )}

      {result.status === 'close' && (
        <p className="mt-2 text-xs text-amber-600">
          Close to target is not the same as meeting it.
        </p>
      )}

      {result.outputLimitExceeded && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-amber-700">
              Your enabled AC devices&rsquo; nameplate load ({formatWatts(result.acNameplateW)}) exceeds the maximum continuous AC output you entered.
              Passing this check does not establish startup-surge compatibility.
            </p>
          </div>
        </div>
      )}

      <dl className="mt-4 space-y-2 border-t border-navy-900/10 pt-4">
        <Metric icon={Clock} label="Target duration" value={formatDuration(result.input.targetHours)} />
        <Metric icon={Gauge} label="Average device load" value={formatWatts(result.acLoadW + result.dcLoadW)} />
        <Metric icon={Battery} label="Battery-side draw" value={formatWatts(result.batteryDrawW)} />
        <Metric icon={Battery} label="Planning energy" value={formatWh(result.planningWh)} />
        {result.requiredUsableWh !== null && (
          <Metric
            icon={Battery}
            label={`Required usable energy${result.input.energyIsUsable ? '' : ' (before reserve)'}`}
            value={formatWh(result.requiredUsableWh)}
          />
        )}
        {result.requiredNominalWh !== null && (
          <Metric
            icon={Battery}
            label="Required nominal capacity"
            value={formatWh(result.requiredNominalWh)}
          />
        )}
      </dl>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <dt className="flex items-center gap-1.5 text-navy-600">
        <Icon className="h-4 w-4 text-navy-600/60" aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-medium text-navy-900">{value}</dd>
    </div>
  );
}
