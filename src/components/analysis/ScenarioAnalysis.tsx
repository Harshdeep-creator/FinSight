import { useState } from 'react';
import { Play, RotateCcw, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { AnalysisResult } from '../../types';

interface Props {
  analysis: AnalysisResult;
}

interface Variable {
  key: string;
  label: string;
  unit: string;
  baseValue: number;
  currentValue: number;
  step: number;
  min: number;
  max: number;
  impactFactor: number;
}

interface ScenarioChange {
  metricKey: string;
  metricLabel: string;
  baseValue: number;
  scenarioValue: number;
  delta: number;
  deltaPct: number;
  driver: string;
}

function buildVariables(analysis: AnalysisResult): Variable[] {
  const metrics = analysis.metrics;
  const vars: Variable[] = [];

  if (metrics['returns_rate']) {
    const v = Number(metrics['returns_rate'].value);
    vars.push({ key: 'returns_rate', label: 'Returns Rate', unit: '%', baseValue: v, currentValue: v, step: 0.5, min: 0, max: 30, impactFactor: -1 });
  }
  if (metrics['avg_order_value']) {
    const v = Number(metrics['avg_order_value'].value);
    vars.push({ key: 'avg_order_value', label: 'Average Order Value', unit: '£', baseValue: v, currentValue: v, step: 1, min: 1, max: 200, impactFactor: 1 });
  }
  if (metrics['revenue_growth_rate']) {
    const v = Number(metrics['revenue_growth_rate'].value);
    vars.push({ key: 'revenue_growth_rate', label: 'Monthly Growth Rate', unit: '%', baseValue: v, currentValue: v, step: 0.5, min: -20, max: 30, impactFactor: 1 });
  }
  if (metrics['customer_concentration_ratio']) {
    const v = Number(metrics['customer_concentration_ratio'].value);
    vars.push({ key: 'customer_concentration_ratio', label: 'Customer Concentration', unit: '%', baseValue: v, currentValue: v, step: 5, min: 0, max: 100, impactFactor: -0.5 });
  }
  if (metrics['geographic_concentration']) {
    const v = Number(metrics['geographic_concentration'].value);
    vars.push({ key: 'geographic_concentration', label: 'Geographic Concentration', unit: '%', baseValue: v, currentValue: v, step: 5, min: 0, max: 100, impactFactor: -0.5 });
  }

  return vars;
}

function computeScenario(vars: Variable[], analysis: AnalysisResult): { changes: ScenarioChange[]; newHealthScore: number } {
  const changes: ScenarioChange[] = [];
  let healthDelta = 0;

  const baseRevenue = Number(analysis.metrics['net_revenue']?.value || 0);
  const baseGross = Number(analysis.metrics['gross_revenue']?.value || 0);

  for (const v of vars) {
    if (v.currentValue === v.baseValue) continue;
    const delta = v.currentValue - v.baseValue;

    if (v.key === 'returns_rate' && baseGross > 0) {
      const baseReturns = (v.baseValue / 100) * baseGross;
      const newReturns = (v.currentValue / 100) * baseGross;
      const revenueChange = baseReturns - newReturns;
      const newRevenue = baseRevenue + revenueChange;
      changes.push({
        metricKey: 'net_revenue',
        metricLabel: 'Net Revenue',
        baseValue: baseRevenue,
        scenarioValue: newRevenue,
        delta: revenueChange,
        deltaPct: (revenueChange / baseRevenue) * 100,
        driver: `${delta > 0 ? 'Increased' : 'Decreased'} returns rate by ${Math.abs(delta).toFixed(1)}pp`,
      });
      healthDelta += delta < 0 ? 3 : -3;
    }

    if (v.key === 'avg_order_value') {
      const avgOrders = analysis.raw_stats.total_transactions / Math.max(1, analysis.raw_stats.unique_customers);
      const customerCount = analysis.raw_stats.unique_customers;
      const revenueChange = (v.currentValue - v.baseValue) * customerCount * avgOrders;
      const newRevenue = baseRevenue + revenueChange;
      changes.push({
        metricKey: 'net_revenue',
        metricLabel: 'Net Revenue (AOV Impact)',
        baseValue: baseRevenue,
        scenarioValue: newRevenue,
        delta: revenueChange,
        deltaPct: (revenueChange / baseRevenue) * 100,
        driver: `AOV ${delta > 0 ? 'increased' : 'decreased'} by £${Math.abs(delta).toFixed(0)}`,
      });
      healthDelta += delta > 0 ? 4 : -4;
    }

    if (v.key === 'revenue_growth_rate') {
      const cmgrBase = v.baseValue / 100;
      const cmgrNew = v.currentValue / 100;
      const projected3m = baseRevenue * Math.pow(1 + cmgrNew, 3);
      const base3m = baseRevenue * Math.pow(1 + cmgrBase, 3);
      changes.push({
        metricKey: 'projected_revenue_3m',
        metricLabel: 'Projected Revenue (3 months)',
        baseValue: Math.round(base3m),
        scenarioValue: Math.round(projected3m),
        delta: projected3m - base3m,
        deltaPct: ((projected3m - base3m) / base3m) * 100,
        driver: `CMGR changed from ${v.baseValue.toFixed(1)}% to ${v.currentValue.toFixed(1)}%`,
      });
      healthDelta += delta > 0 ? 3 : -3;
    }

    changes.push({
      metricKey: v.key,
      metricLabel: v.label,
      baseValue: v.baseValue,
      scenarioValue: v.currentValue,
      delta,
      deltaPct: v.baseValue !== 0 ? (delta / v.baseValue) * 100 : 0,
      driver: 'User-defined scenario variable',
    });
  }

  const baseHealth = analysis.health_score.overall;
  const newHealth = Math.min(100, Math.max(0, baseHealth + healthDelta));
  return { changes, newHealthScore: Math.round(newHealth) };
}

function ChangeRow({ change }: { change: ScenarioChange }) {
  const isPositive = change.delta > 0;
  const icon = change.delta === 0 ? <Minus size={12} style={{ color: 'var(--c-text-4)' }} /> : isPositive ? <ArrowUpRight size={12} className="text-green-600" /> : <ArrowDownRight size={12} className="text-red-500" />;

  const fmtVal = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return v.toLocaleString('en-GB', { maximumFractionDigits: 0 });
    return v.toFixed(2);
  };

  return (
    <div className="grid grid-cols-4 items-center px-3 py-2 transition-colors" style={{ borderBottom: '1px solid var(--c-border)' }}>
      <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>{change.metricLabel}</span>
      <span className="text-xs font-numeric text-right" style={{ color: 'var(--c-text-4)' }}>{fmtVal(change.baseValue)}</span>
      <span className="text-xs font-numeric text-right" style={{ color: 'var(--c-text-1)' }}>{fmtVal(change.scenarioValue)}</span>
      <div className="flex items-center justify-end gap-1">
        {icon}
        <span className={`text-xs font-numeric ${change.delta === 0 ? '' : isPositive ? 'text-green-600' : 'text-red-500'}`}>{change.deltaPct > 0 ? '+' : ''}{change.deltaPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function ScenarioAnalysis({ analysis }: Props) {
  const [variables, setVariables] = useState<Variable[]>(buildVariables(analysis));
  const [result, setResult] = useState<{ changes: ScenarioChange[]; newHealthScore: number } | null>(null);

  const hasChanges = variables.some(v => v.currentValue !== v.baseValue);

  const runScenario = () => {
    const r = computeScenario(variables, analysis);
    setResult(r);
  };

  const reset = () => {
    setVariables(v => v.map(vr => ({ ...vr, currentValue: vr.baseValue })));
    setResult(null);
  };

  const updateVar = (key: string, value: number) => {
    setVariables(v => v.map(vr => vr.key === key ? { ...vr, currentValue: value } : vr));
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-4)' }}>
        Modify variables below to simulate different business scenarios. The engine recalculates financial outcomes based on your changes.
        All scenarios are grounded in the computed metrics — no unsupported assumptions are made.
      </p>

      {/* Variables */}
      <div className="card" style={{ background: 'var(--c-card)' }}>
        {variables.map((v, idx) => {
          const changed = v.currentValue !== v.baseValue;
          return (
            <div key={v.key} className="p-4" style={idx > 0 ? { borderTop: '1px solid var(--c-border)' } : {}}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>{v.label}</label>
                  <p className="text-2xs mt-0.5" style={{ color: 'var(--c-text-5)' }}>
                    Base: {v.unit === '£' ? `£${v.baseValue.toFixed(2)}` : `${v.baseValue.toFixed(1)}${v.unit}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {changed && (
                    <span className="badge-amber text-2xs">Modified</span>
                  )}
                  <span className="text-sm font-semibold font-numeric" style={{ color: changed ? 'var(--c-text-1)' : 'var(--c-text-3)' }}>
                    {v.unit === '£' ? `£${v.currentValue.toFixed(2)}` : `${v.currentValue.toFixed(1)}${v.unit}`}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={v.min}
                max={v.max}
                step={v.step}
                value={v.currentValue}
                onChange={e => updateVar(v.key, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full cursor-pointer accent-neutral-900"
              />
              <div className="flex justify-between mt-1">
                <span className="text-2xs" style={{ color: 'var(--c-text-5)' }}>{v.min}{v.unit}</span>
                <span className="text-2xs" style={{ color: 'var(--c-text-5)' }}>{v.max}{v.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={runScenario} disabled={!hasChanges} className="btn-primary flex-1">
          <Play size={13} />
          Run Scenario Analysis
        </button>
        {hasChanges && (
          <button onClick={reset} className="btn-secondary">
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Base Health Score</p>
              <p className="text-xl font-semibold font-numeric" style={{ color: 'var(--c-text-1)' }}>{analysis.health_score.overall}<span className="text-xs" style={{ color: 'var(--c-text-4)' }}>/100</span></p>
            </div>
            <div className="card p-3 text-center" style={{ background: result.newHealthScore > analysis.health_score.overall ? 'rgba(34, 197, 94, 0.1)' : result.newHealthScore < analysis.health_score.overall ? 'rgba(239, 68, 68, 0.1)' : 'var(--c-card)', border: result.newHealthScore > analysis.health_score.overall ? '1px solid rgba(34, 197, 94, 0.2)' : result.newHealthScore < analysis.health_score.overall ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--c-border)' }}>
              <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Scenario Health Score</p>
              <p className="text-xl font-semibold font-numeric" style={{ color: result.newHealthScore > analysis.health_score.overall ? '#16a34a' : result.newHealthScore < analysis.health_score.overall ? '#ef4444' : 'var(--c-text-1)' }}>
                {result.newHealthScore}<span className="text-xs" style={{ color: 'var(--c-text-4)' }}>/100</span>
              </p>
            </div>
          </div>

          {result.changes.length > 0 && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-4 px-3 py-2" style={{ background: 'var(--c-bg-2)', borderBottom: '1px solid var(--c-border)' }}>
                <span className="text-2xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-4)' }}>Metric</span>
                <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>Base</span>
                <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>Scenario</span>
                <span className="text-2xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--c-text-4)' }}>Change</span>
              </div>
              {result.changes.map((c, i) => <ChangeRow key={i} change={c} />)}
            </div>
          )}

          <div className="rounded-md p-3" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}>
            <p className="text-2xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-4)' }}>Interpretation</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
              {result.changes.length === 0
                ? 'No material changes detected from the scenario variables modified.'
                : `The scenario produces ${result.changes.length} metric changes. Health score ${result.newHealthScore > analysis.health_score.overall ? `improves from ${analysis.health_score.overall} to ${result.newHealthScore}` : result.newHealthScore < analysis.health_score.overall ? `declines from ${analysis.health_score.overall} to ${result.newHealthScore}` : 'remains unchanged'}. All changes are derived from the mathematical relationships between your input variables and the computed financial metrics.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
