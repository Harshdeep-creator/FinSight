import type { HealthScore as HealthScoreType } from '../../types';

interface Props {
  score: HealthScoreType;
}

const GRADE_CONFIG = {
  excellent: { label: 'Excellent', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
  good: { label: 'Good', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.15)' },
  fair: { label: 'Fair', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  poor: { label: 'Poor', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
};

function ScoreDimension({ label, value, description }: { label: string; value: number; description: string }) {
  const pct = value;
  const color = pct >= 80 ? '#22c55e' : pct >= 65 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="card p-4 flex flex-col items-center text-center">
      <div className="relative mb-3">
        <svg width="44" height="44" className="-rotate-90">
          <circle cx="22" cy="22" r="16" fill="none" stroke="var(--c-border)" strokeWidth="3" />
          <circle cx="22" cy="22" r="16" fill="none" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold font-numeric" style={{ color: 'var(--c-text-1)' }}>{value}</span>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>{label}</p>
      <p className="text-2xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>{description}</p>
    </div>
  );
}

export function HealthScore({ score }: Props) {
  const config = GRADE_CONFIG[score.grade];
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Main score */}
      <div className="card border p-6" style={{ background: config.bg, borderColor: config.border }}>
        <div className="flex items-start gap-6">
          {/* Ring */}
          <div className="flex-shrink-0 relative">
            <svg width="100" height="100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--c-border)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={config.color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-numeric" style={{ color: config.color }}>{score.overall}</span>
              <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>/100</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--c-text-1)' }}>Financial Health Score</h3>
              <span className={`badge-${score.grade === 'excellent' || score.grade === 'good' ? 'green' : score.grade === 'fair' ? 'amber' : 'red'} text-xs`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-3)' }}>{score.summary}</p>
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-5 gap-3">
        <ScoreDimension label="Profitability" value={score.profitability} description="Revenue quality" />
        <ScoreDimension label="Liquidity" value={score.liquidity} description="Cash availability" />
        <ScoreDimension label="Growth" value={score.growth} description="Revenue trajectory" />
        <ScoreDimension label="Cash Position" value={score.cash_position} description="Financial buffer" />
        <ScoreDimension label="Risk Exposure" value={score.risk_exposure} description="Concentration risk" />
      </div>
    </div>
  );
}
