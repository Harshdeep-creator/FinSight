import { useState } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { KeyFinding } from '../../types';

interface Props {
  findings: KeyFinding[];
}

const TYPE_CONFIG = {
  opportunity: { icon: TrendingUp, label: 'Opportunity', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
  risk: { icon: AlertTriangle, label: 'Risk', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
  warning: { icon: AlertCircle, label: 'Warning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  insight: { icon: Lightbulb, label: 'Insight', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
};

const IMPACT_CONFIG = {
  high: { label: 'High Impact', color: '#ef4444' },
  medium: { label: 'Medium Impact', color: '#f59e0b' },
  low: { label: 'Low Impact', color: 'var(--c-text-4)' },
};

function FindingCard({ finding }: { finding: KeyFinding }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[finding.type];
  const impactCfg = IMPACT_CONFIG[finding.impact];
  const Icon = config.icon;

  return (
    <div className="card border overflow-hidden" style={{ background: config.bg, borderColor: config.border }}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={15} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-snug" style={{ color: 'var(--c-text-1)' }}>{finding.title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xs font-medium" style={{ color: impactCfg.color }}>{impactCfg.label}</span>
              {expanded ? <ChevronUp size={13} style={{ color: 'var(--c-text-4)' }} /> : <ChevronDown size={13} style={{ color: 'var(--c-text-4)' }} />}
            </div>
          </div>
          <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--c-text-3)' }}>{finding.description}</p>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 animate-fade-in space-y-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          <div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>{finding.description}</p>
          </div>
          <div className="rounded-md p-3" style={{ background: 'var(--c-bg-2)' }}>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Evidence</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{finding.evidence}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function KeyFindings({ findings }: Props) {
  const risks = findings.filter(f => f.type === 'risk' || f.type === 'warning');
  const opportunities = findings.filter(f => f.type === 'opportunity' || f.type === 'insight');

  return (
    <div className="space-y-4 animate-slide-up">
      {risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Risks & Warnings</h4>
          {risks.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>
      )}
      {opportunities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Opportunities & Insights</h4>
          {opportunities.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>
      )}
    </div>
  );
}
