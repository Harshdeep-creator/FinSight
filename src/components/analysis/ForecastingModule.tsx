import { TrendingUp, Info } from 'lucide-react';
import type { Forecast } from '../../types';

interface Props {
  forecasts: Record<string, Forecast>;
}

function ForecastChart({ points }: { points: Forecast['data_points'] }) {
  if (!points.length) return null;
  const maxVal = Math.max(...points.map(p => p.confidence_upper));
  const minVal = Math.min(0, ...points.map(p => p.confidence_lower));
  const range = maxVal - minVal;
  const H = 120;
  const W = 100 / points.length;

  return (
    <div className="relative" style={{ height: H + 32 }}>
      <svg width="100%" height={H} className="overflow-visible">
        {/* Confidence bands */}
        {points.map((p, i) => {
          const upperY = H - ((p.confidence_upper - minVal) / range) * H;
          const lowerY = H - ((p.confidence_lower - minVal) / range) * H;
          return (
            <g key={p.period}>
              <rect x={`${i * W + W * 0.15}%`} width={`${W * 0.7}%`} y={upperY} height={lowerY - upperY} fill="rgba(59,130,246,0.08)" rx={2} />
              <rect x={`${i * W + W * 0.3}%`} width={`${W * 0.4}%`} y={H - ((p.value - minVal) / range) * H - 4} height={8} fill="rgb(59,130,246)" rx={2} />
            </g>
          );
        })}
      </svg>
      <div className="flex">
        {points.map(p => (
          <div key={p.period} className="flex-1 text-center">
            <p className="text-2xs truncate px-1" style={{ color: 'var(--c-text-4)' }}>{p.period}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const shown = forecast.data_points;
  const conf = forecast.confidence_score;
  const confClass = conf >= 70 ? 'badge-green' : conf >= 55 ? 'badge-amber' : 'badge-red';

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium" style={{ color: 'var(--c-text-1)' }}>{forecast.label}</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>{forecast.method}</p>
        </div>
        <span className={`${confClass} flex-shrink-0`}>{conf}% confidence</span>
      </div>

      <ForecastChart points={shown} />

      {/* Data points table */}
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
        <div className="grid grid-cols-4 px-3 py-1.5" style={{ background: 'var(--c-bg-2)', borderBottom: '1px solid var(--c-border)' }}>
          <span className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Period</span>
          <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>Forecast</span>
          <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>Low</span>
          <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>High</span>
        </div>
        {shown.map(p => (
          <div key={p.period} className="grid grid-cols-4 px-3 py-2 transition-colors" style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-card)' }}>
            <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>{p.period}</span>
            <span className="text-xs font-numeric font-medium text-right" style={{ color: 'var(--c-text-1)' }}>£{p.value.toLocaleString()}</span>
            <span className="text-xs font-numeric text-right" style={{ color: 'var(--c-text-4)' }}>£{p.confidence_lower.toLocaleString()}</span>
            <span className="text-xs font-numeric text-right" style={{ color: 'var(--c-text-4)' }}>£{p.confidence_upper.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Confidence note */}
      <div className="rounded-md p-3 flex items-start gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
        <Info size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#f59e0b' }}>Confidence Note</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{forecast.explanation}</p>
        </div>
      </div>

      {/* Assumptions */}
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--c-text-4)' }}>Forecast Assumptions</p>
        <ul className="space-y-1">
          {forecast.assumptions.map((a, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-xs mt-0.5" style={{ color: 'var(--c-text-5)' }}>-</span>
              <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ForecastingModule({ forecasts }: Props) {
  const list = Object.values(forecasts);
  if (!list.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <TrendingUp size={24} className="mb-3" style={{ color: 'var(--c-text-5)' }} />
      <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>Forecasts require at least 3 months of historical data.</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-md p-3 flex items-start gap-2" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}>
        <Info size={13} style={{ color: 'var(--c-text-4)' }} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
          All forecasts are statistical projections derived from observed data. Confidence scores indicate the reliability of each projection.
          Numbers marked with confidence below 65% should be used for directional guidance only — not operational budgeting.
        </p>
      </div>
      {list.map(f => (
        <ForecastCard key={f.metric + f.horizon} forecast={f} />
      ))}
    </div>
  );
}
