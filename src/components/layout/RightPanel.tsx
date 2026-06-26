import { useState } from 'react';
import { AlertTriangle, TrendingUp, Database, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-bg-4)' }}>
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-numeric w-6 text-right" style={{ color: 'var(--c-text-3)' }}>{value}</span>
    </div>
  );
}

function scoreColor(v: number) {
  if (v >= 80) return 'bg-green-500';
  if (v >= 65) return 'bg-green-400';
  if (v >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

type Tab = 'overview' | 'alerts' | 'forecasts';

export function RightPanel() {
  const { activeWorkspace, activeAnalysis } = useApp();
  const [tab, setTab] = useState<Tab>('overview');

  if (!activeWorkspace) {
    return (
      <aside className="flex flex-col h-full p-4" style={{ width: 'var(--right-panel-width)', flexShrink: 0, background: 'var(--c-bg-2)', borderLeft: '1px solid var(--c-border)' }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Info size={24} className="mx-auto mb-2" style={{ color: 'var(--c-text-4)' }} />
            <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>Select a workspace to see intelligence panel</p>
          </div>
        </div>
      </aside>
    );
  }

  const analysis = activeAnalysis;
  const hs = analysis?.health_score;
  const anomalies = analysis?.anomalies || [];
  const forecasts = Object.values(analysis?.forecasts || {});
  const rawStats = analysis?.raw_stats;

  const criticalAlerts = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
  const informational = anomalies.filter(a => a.severity === 'medium' || a.severity === 'low');

  return (
    <aside className="flex flex-col h-full" style={{ width: 'var(--right-panel-width)', flexShrink: 0, background: 'var(--c-bg)', borderLeft: '1px solid var(--c-border)' }}>
      {/* Panel Header */}
      <div className="px-4 pt-3 pb-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>Intelligence Panel</span>
          {activeWorkspace.is_demo && <span className="badge-neutral text-2xs">Demo</span>}
        </div>
        <div className="flex gap-0">
          {(['overview', 'alerts', 'forecasts'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 px-0 mr-4 text-xs font-medium border-b-2 transition-colors duration-100 capitalize"
              style={{
                borderColor: tab === t ? 'var(--c-text-1)' : 'transparent',
                color: tab === t ? 'var(--c-text-1)' : 'var(--c-text-4)'
              }}
            >
              {t}
              {t === 'alerts' && anomalies.length > 0 && (
                <span className={`ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-2xs font-semibold ${criticalAlerts.length > 0 ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                  {anomalies.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Dataset */}
            {rawStats && (
              <div className="card p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Database size={12} style={{ color: 'var(--c-text-4)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Dataset</span>
                </div>
                <div className="space-y-1.5">
                  <Row label="Name" value={activeWorkspace.dataset_name || 'Unknown'} />
                  <Row label="Records" value={rawStats.total_transactions.toLocaleString()} />
                  <Row label="Customers" value={rawStats.unique_customers.toLocaleString()} />
                  <Row label="Products" value={rawStats.unique_products.toLocaleString()} />
                  <Row label="Period" value={`${rawStats.date_range.start.slice(0, 7)} – ${rawStats.date_range.end.slice(0, 7)}`} />
                </div>
              </div>
            )}

            {/* Health Score */}
            {hs && (
              <div className="card p-3 border" style={{ background: hs.grade === 'excellent' || hs.grade === 'good' ? 'rgba(34, 197, 94, 0.1)' : hs.grade === 'fair' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: hs.grade === 'excellent' || hs.grade === 'good' ? 'rgba(34, 197, 94, 0.3)' : hs.grade === 'fair' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Health Score</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-semibold font-numeric" style={{ color: hs.grade === 'excellent' ? '#16a34a' : hs.grade === 'good' ? '#22c55e' : hs.grade === 'fair' ? '#f59e0b' : '#ef4444' }}>{hs.overall}</span>
                    <span className="text-xs" style={{ color: 'var(--c-text-4)' }}>/100</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>Profitability</span>
                    </div>
                    <ScoreBar value={hs.profitability} color={scoreColor(hs.profitability)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>Growth</span>
                    </div>
                    <ScoreBar value={hs.growth} color={scoreColor(hs.growth)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>Liquidity</span>
                    </div>
                    <ScoreBar value={hs.liquidity} color={scoreColor(hs.liquidity)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>Cash Position</span>
                    </div>
                    <ScoreBar value={hs.cash_position} color={scoreColor(hs.cash_position)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>Risk Exposure</span>
                    </div>
                    <ScoreBar value={hs.risk_exposure} color={scoreColor(hs.risk_exposure)} />
                  </div>
                </div>
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <span className="text-2xs font-semibold uppercase tracking-wide" style={{ color: hs.grade === 'excellent' ? '#16a34a' : hs.grade === 'good' ? '#22c55e' : hs.grade === 'fair' ? '#f59e0b' : '#ef4444' }}>{hs.grade}</span>
                </div>
              </div>
            )}

            {/* Timestamps */}
            {activeWorkspace.last_analysis_at && (
              <div className="flex items-center gap-1.5 text-2xs" style={{ color: 'var(--c-text-4)' }}>
                <Clock size={10} />
                <span>Analyzed {new Date(activeWorkspace.last_analysis_at).toLocaleDateString()}</span>
              </div>
            )}

            {!analysis && (
              <div className="text-center py-6">
                <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>Upload a file to see analysis results.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'alerts' && (
          <div className="p-4 space-y-2">
            {anomalies.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle size={20} className="text-green-500 mx-auto mb-2" />
                <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>No anomalies detected.</p>
              </div>
            )}
            {criticalAlerts.length > 0 && (
              <div className="space-y-2">
                <span className="section-title block px-0 pt-1 pb-1">Critical / High</span>
                {criticalAlerts.map(a => (
                  <AlertCard key={a.id} severity={a.severity} description={a.description} impact={a.impact} />
                ))}
              </div>
            )}
            {informational.length > 0 && (
              <div className="space-y-2 mt-3">
                <span className="section-title block px-0 pt-1 pb-1">Informational</span>
                {informational.map(a => (
                  <AlertCard key={a.id} severity={a.severity} description={a.description} impact={a.impact} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'forecasts' && (
          <div className="p-4 space-y-3">
            {forecasts.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp size={20} className="mx-auto mb-2" style={{ color: 'var(--c-text-4)' }} />
                <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>Forecasts generated after analysis.</p>
              </div>
            )}
            {forecasts.map(f => (
              <div key={f.metric + f.horizon} className="card p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>{f.label}</span>
                  <ConfidenceBadge value={f.confidence_score} />
                </div>
                <p className="text-2xs" style={{ color: 'var(--c-text-4)' }}>{f.method}</p>
                {f.data_points.slice(0, 3).map(dp => (
                  <div key={dp.period} className="flex items-center justify-between">
                    <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>{dp.period}</span>
                    <span className="text-xs font-numeric font-medium" style={{ color: 'var(--c-text-1)' }}>£{dp.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-2xs flex-shrink-0" style={{ color: 'var(--c-text-4)' }}>{label}</span>
      <span className="text-2xs font-medium text-right truncate" style={{ color: 'var(--c-text-2)' }}>{value}</span>
    </div>
  );
}

function AlertCard({ severity, description, impact }: { severity: string; description: string; impact: string }) {
  const bgStyle = {
    critical: { background: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
    high: { background: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
    medium: { background: 'var(--c-bg-2)', border: 'var(--c-border)' },
    low: { background: 'var(--c-bg-2)', border: 'var(--c-border)' },
  }[severity] || { background: 'var(--c-bg-2)', border: 'var(--c-border)' };

  const icon = severity === 'critical' || severity === 'high'
    ? <AlertTriangle size={11} className={severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />
    : <XCircle size={11} style={{ color: 'var(--c-text-4)' }} />;

  return (
    <div className="rounded-md border p-2.5" style={{ background: bgStyle.background, borderColor: bgStyle.border }}>
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 flex-shrink-0">{icon}</span>
        <div>
          <p className="text-2xs leading-snug" style={{ color: 'var(--c-text-2)' }}>{description}</p>
          {impact && (
            <p className="text-2xs mt-1 leading-snug" style={{ color: 'var(--c-text-4)' }}>{impact}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const cls = value >= 75 ? 'badge-green' : value >= 60 ? 'badge-amber' : 'badge-red';
  return <span className={cls}>{value}% conf.</span>;
}
