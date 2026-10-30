interface AdSlotProps {
  slotId: string;
  className?: string;
  format?: 'leaderboard' | 'rectangle' | 'square' | 'inline';
}

const FORMAT_DIMENSIONS: Record<string, { minHeight: string; label: string }> = {
  leaderboard: { minHeight: '90px', label: '728×90' },
  rectangle: { minHeight: '250px', label: '300×250' },
  square: { minHeight: '250px', label: '300×250' },
  inline: { minHeight: '120px', label: 'Fluid' },
};

/**
 * Reusable ad slot, AdSense-ready. Disabled by default.
 *
 * When VITE_ADS_ENABLED is "true":
 * - In development: shows a clearly labeled placeholder that reserves space.
 * - In production: renders a container ready for AdSense script injection.
 *
 * When disabled (default): renders nothing.
 *
 * To enable real ads, set VITE_ADS_ENABLED=true and configure your
 * AdSense publisher ID in the environment. Review privacy disclosures
 * and consent requirements before enabling ads.
 */
export function AdSlot({ slotId, className = '', format = 'leaderboard' }: AdSlotProps) {
  const isDev = import.meta.env.DEV;
  const isAdsEnabled = Boolean(
    (import.meta.env.VITE_ADS_ENABLED ?? '') === 'true'
  );

  if (!isAdsEnabled) return null;

  const dims = FORMAT_DIMENSIONS[format] ?? FORMAT_DIMENSIONS.leaderboard;

  if (!isDev) {
    return (
      <div
        data-ad-slot={slotId}
        data-ad-format={format}
        className={`ad-container ${className}`}
        style={{ minHeight: dims.minHeight }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-dashed border-navy-900/20 bg-cream-100 text-center ${className}`}
      style={{ minHeight: dims.minHeight }}
      aria-label="Advertisement placeholder"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-600/50">
          Ad placeholder
        </p>
        <p className="mt-1 text-xs text-navy-600/40">
          {dims.label} · {slotId}
        </p>
        <p className="mt-1 text-xs text-navy-600/30">
          Enable VITE_ADS_ENABLED to activate
        </p>
      </div>
    </div>
  );
}
