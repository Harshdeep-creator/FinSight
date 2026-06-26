import { useState } from 'react';
import { GitBranch, Database, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditTrail as AuditTrailType } from '../../types';

interface Props {
  audit: AuditTrailType;
}

function StepCard({ step, isLast }: { step: AuditTrailType['steps'][0]; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--c-text-1)' }}>
          <span className="text-2xs font-semibold" style={{ color: 'var(--c-bg)' }}>{step.step}</span>
        </div>
        {!isLast && <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'var(--c-border)' }} />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
        <div
          className="card p-3 cursor-pointer transition-colors"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>{step.action}</p>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>{step.result}</p>
            </div>
            {open ? <ChevronUp size={13} style={{ color: 'var(--c-text-5)' }} className="flex-shrink-0" /> : <ChevronDown size={13} style={{ color: 'var(--c-text-5)' }} className="flex-shrink-0" />}
          </div>

          {open && (
            <div className="mt-3 pt-3 space-y-2 animate-fade-in" style={{ borderTop: '1px solid var(--c-border)' }}>
              <div className="flex items-start gap-1.5">
                <Database size={11} style={{ color: 'var(--c-text-4)' }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Data Source</p>
                  <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{step.data_source}</p>
                </div>
              </div>
              {step.formula && (
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Formula</p>
                  <code className="block text-xs font-mono rounded px-2 py-1.5" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-3)' }}>{step.formula}</code>
                </div>
              )}
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Reasoning</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>{step.reasoning}</p>
              </div>
              {step.metrics_involved.length > 0 && (
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Metrics Generated</p>
                  <div className="flex flex-wrap gap-1">
                    {step.metrics_involved.map(m => (
                      <span key={m} className="badge-neutral text-2xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditTrail({ audit }: Props) {
  const qualityColor = audit.data_quality_score >= 90 ? '#22c55e' : audit.data_quality_score >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="card p-4 grid grid-cols-4 gap-4">
        <Stat label="Dataset" value={audit.dataset_name} />
        <Stat label="Total Records" value={audit.total_records.toLocaleString()} />
        <Stat label="Valid Records" value={audit.valid_records.toLocaleString()} />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--c-text-4)' }}>Data Quality</p>
          <p className="text-sm font-semibold font-numeric" style={{ color: qualityColor }}>{audit.data_quality_score.toFixed(1)}%</p>
        </div>
      </div>

      {/* Intro */}
      <div className="flex items-start gap-2 p-3 rounded-md" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}>
        <GitBranch size={13} style={{ color: 'var(--c-text-4)' }} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
          This audit trail documents every decision, formula, and data source used to reach the analysis conclusions.
          Click each step to see the full reasoning and evidence chain.
        </p>
      </div>

      {/* Timeline */}
      <div>
        {audit.steps.map((step, i) => (
          <StepCard key={step.step} step={step} isLast={i === audit.steps.length - 1} />
        ))}
      </div>

      {/* Conclusion */}
      <div className="card p-4" style={{ border: '1px solid var(--c-border)' }}>
        <p className="text-2xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--c-text-4)' }}>Analysis Conclusion</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{audit.conclusion}</p>
        <p className="text-2xs mt-2" style={{ color: 'var(--c-text-5)' }}>Generated: {new Date(audit.generated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--c-text-4)' }}>{label}</p>
      <p className="text-sm font-medium truncate" style={{ color: 'var(--c-text-1)' }}>{value}</p>
    </div>
  );
}
