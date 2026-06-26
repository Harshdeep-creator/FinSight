import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { FinancialMetric } from '../../types';

interface Props {
  metrics: Record<string, FinancialMetric>;
}

function AssessmentIcon({ assessment }: { assessment: FinancialMetric['assessment'] }) {
  if (assessment === 'positive') return <ArrowUpRight size={13} className="text-green-600" />;
  if (assessment === 'negative') return <ArrowDownRight size={13} className="text-red-500" />;
  if (assessment === 'warning') return <ArrowDownRight size={13} className="text-amber-500" />;
  return <Minus size={13} style={{ color: 'var(--c-text-4)' }} />;
}

function assessmentBadge(assessment: FinancialMetric['assessment'], label: string) {
  const classes = {
    positive: 'badge-green',
    negative: 'badge-red',
    warning: 'badge-amber',
    neutral: 'badge-neutral',
  };
  return <span className={classes[assessment]}>{label}</span>;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-green-500' : value >= 75 ? 'bg-green-400' : value >= 60 ? 'bg-amber-400' : 'bg-neutral-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-bg-4)' }}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-2xs font-numeric w-7" style={{ color: 'var(--c-text-4)' }}>{value}%</span>
    </div>
  );
}

function MetricCard({ metric }: { metric: FinancialMetric }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)} style={{ background: expanded ? 'var(--c-bg-2)' : 'var(--c-card)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium uppercase tracking-wide leading-snug" style={{ color: 'var(--c-text-4)' }}>{metric.label}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <AssessmentIcon assessment={metric.assessment} />
            {expanded ? <ChevronUp size={12} style={{ color: 'var(--c-text-5)' }} /> : <ChevronDown size={12} style={{ color: 'var(--c-text-5)' }} />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="metric-value">{metric.formatted_value}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          {assessmentBadge(metric.assessment, metric.assessment_label)}
          <span className="text-2xs" style={{ color: 'var(--c-text-5)' }}>{metric.unit}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3 animate-fade-in" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Meaning */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>What This Means</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{metric.meaning}</p>
          </div>

          {/* Evidence */}
          <div className="rounded-md p-3" style={{ background: 'var(--c-bg-2)' }}>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Evidence</p>
            <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--c-text-3)' }}>{metric.evidence}</p>
          </div>

          {/* Calculation */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Calculation</p>
            <p className="text-xs font-mono rounded px-2 py-1" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-3)' }}>{metric.calculation_path}</p>
          </div>

          {/* Suggested Action */}
          <div className="rounded-md p-3" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#60a5fa' }}>Suggested Action</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-1)' }}>{metric.suggested_action}</p>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Calculation Confidence</p>
            </div>
            <ConfidenceBar value={metric.confidence} />
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ metrics }: Props) {
  const metricList = Object.values(metrics);

  return (
    <div className="space-y-3 animate-slide-up">
      <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-4)' }}>
        Click any metric to expand its full financial explanation, evidence, and recommended action.
        All metrics are derived directly from the uploaded dataset — no assumptions are made beyond explicitly stated formulas.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {metricList.map(m => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
}
