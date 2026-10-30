import { useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: ReactNode;
  label?: string;
}

export function Tooltip({ content, label }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-navy-600/60 transition hover:text-teal-600"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-label={label ?? 'More information'}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-xs font-normal leading-relaxed text-cream-50 shadow-soft animate-fade-in"
        >
          {content}
        </span>
      )}
    </span>
  );
}
