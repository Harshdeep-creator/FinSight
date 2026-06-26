import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Anomaly } from '../../types';

interface Props {
  anomalies: Anomaly[];
}

const SEV_CONFIG = {
  critical: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', badge: 'badge-red', label: 'Critical' },
  high: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', badge: 'badge-amber', label: 'High' },
  medium: { icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.2)', badge: 'badge-amber', label: 'Medium' },
  low: { icon: Info, color: 'var(--c-text-4)', bg: 'var(--c-bg-2)', border: 'var(--c-border)', badge: 'badge-neutral', label: 'Low' },
};

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [expanded, setExpanded] = useState(anomaly.severity === 'critical');
  const cfg = SEV_CONFIG[anomaly.severity];
  const Icon = cfg.icon;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cfg.badge}>{cfg.label}</span>
              <span className="text-2xs" style={{ color: 'var(--c-text-5)' }}>{anomaly.field}</span>
            </div>
            {expanded ? <ChevronUp size={13} style={{ color: 'var(--c-text-4)' }} className="flex-shrink-0" /> : <ChevronDown size={13} style={{ color: 'var(--c-text-4)' }} className="flex-shrink-0" />}
          </div>
          <p className="text-sm font-medium mt-1 leading-snug" style={{ color: 'var(--c-text-1)' }}>{anomaly.description}</p>
          {!expanded && (
            <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--c-text-4)' }}>{anomaly.impact}</p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="pt-3 space-y-3" style={{ borderTop: '1px solid var(--c-border)' }}>
            <Section title="Evidence" content={anomaly.evidence} />
            <Section title="Financial Impact" content={anomaly.impact} />
            <Section title="Investigation Recommendation" content={anomaly.investigation_recommendation} highlight />
            {anomaly.expected_range && (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Detected Value</p>
                  <p className="text-xs font-numeric mt-0.5" style={{ color: 'var(--c-text-1)' }}>{typeof anomaly.value === 'number' ? anomaly.value.toLocaleString() : anomaly.value}</p>
                </div>
                <div style={{ color: 'var(--c-text-5)' }}>→</div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Expected Range</p>
                  <p className="text-xs font-numeric mt-0.5" style={{ color: 'var(--c-text-1)' }}>{anomaly.expected_range}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, content, highlight }: { title: string; content: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'rounded-md p-3' : ''} style={highlight ? { background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' } : {}}>
      <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: highlight ? '#3b82f6' : 'var(--c-text-4)' }}>{title}</p>
      <p className="text-xs leading-relaxed" style={{ color: highlight ? 'var(--c-text-1)' : 'var(--c-text-3)' }}>{content}</p>
    </div>
  );
}

export function AnomalyCenter({ anomalies }: Props) {
  if (!anomalies.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center animate-fade-in">
        <CheckCircle size={24} className="text-green-500 mb-3" />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--c-text-2)' }}>No anomalies detected</p>
        <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>The dataset passed all statistical and rule-based checks.</p>
      </div>
    );
  }

  const bySeverity = {
    critical: anomalies.filter(a => a.severity === 'critical'),
    high: anomalies.filter(a => a.severity === 'high'),
    medium: anomalies.filter(a => a.severity === 'medium'),
    low: anomalies.filter(a => a.severity === 'low'),
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {(['critical', 'high', 'medium', 'low'] as const).map(s => (
          <div key={s} className="card p-3 text-center">
            <p className="text-lg font-semibold font-numeric" style={{ color: bySeverity[s].length > 0 && s === 'critical' ? '#ef4444' : bySeverity[s].length > 0 && s === 'high' ? '#f59e0b' : 'var(--c-text-3)' }}>{bySeverity[s].length}</p>
            <p className="text-2xs capitalize" style={{ color: 'var(--c-text-5)' }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Cards by severity */}
      {(['critical', 'high', 'medium', 'low'] as const).map(s =>
        bySeverity[s].length > 0 && (
          <div key={s} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>{s} severity</h4>
            {bySeverity[s].map(a => <AnomalyCard key={a.id} anomaly={a} />)}
          </div>
        )
      )}
    </div>
  );
}
