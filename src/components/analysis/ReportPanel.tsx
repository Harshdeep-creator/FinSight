import { useState } from 'react';
import { Download, Copy, FileSpreadsheet, Check } from 'lucide-react';
import type { AnalysisResult } from '../../types';

interface Props {
  analysis: AnalysisResult;
}

export function ReportPanel({ analysis }: Props) {
  const [copied, setCopied] = useState(false);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(analysis.report_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  const downloadReport = () => {
    const blob = new Blob([analysis.report_summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsight-report-${analysis.audit_trail.dataset_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const metrics = Object.values(analysis.metrics);
    const headers = ['Metric', 'Value', 'Unit', 'Assessment', 'Evidence', 'Suggested Action'];
    const rows = metrics.map(m => [m.label, m.formatted_value, m.unit, m.assessment_label, `"${m.evidence.replace(/"/g, '""')}"`, `"${m.suggested_action.replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsight-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-semibold mt-4 mb-2 first:mt-0" style={{ color: 'var(--c-text-1)' }}>{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold mt-4 mb-1.5" style={{ color: 'var(--c-text-1)' }}>{line.slice(3)}</h2>;
      if (line.startsWith('---')) return <hr key={i} className="my-3" style={{ borderColor: 'var(--c-border)' }} />;
      if (line.startsWith('- ')) {
        const parts = line.slice(2).split('**');
        return (
          <li key={i} className="text-xs leading-relaxed ml-3" style={{ color: 'var(--c-text-2)' }}>
            {parts.map((p, j) => j % 2 === 0 ? <span key={j}>{p}</span> : <strong key={j} className="font-medium" style={{ color: 'var(--c-text-1)' }}>{p}</strong>)}
          </li>
        );
      }
      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-2xs italic mt-2" style={{ color: 'var(--c-text-5)' }}>{line.slice(1, -1)}</p>;
      if (!line.trim()) return <div key={i} className="h-1" />;
      const parts = line.split('**');
      return (
        <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
          {parts.map((p, j) => j % 2 === 0 ? <span key={j}>{p}</span> : <strong key={j} className="font-medium" style={{ color: 'var(--c-text-1)' }}>{p}</strong>)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={copyReport} className="btn-secondary">
          {copied ? <><Check size={13} className="text-green-500" /> Copied</> : <><Copy size={13} /> Copy Report</>}
        </button>
        <button onClick={downloadReport} className="btn-secondary">
          <Download size={13} />
          Download as Markdown
        </button>
        <button onClick={downloadCSV} className="btn-secondary">
          <FileSpreadsheet size={13} />
          Export Metrics to CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <ReportStat label="Metrics Computed" value={Object.keys(analysis.metrics).length.toString()} />
        <ReportStat label="Key Findings" value={analysis.key_findings.length.toString()} />
        <ReportStat label="Anomalies" value={analysis.anomalies.length.toString()} />
        <ReportStat label="Audit Steps" value={analysis.audit_trail.steps.length.toString()} />
      </div>

      {/* Report Content */}
      <div className="card p-6 prose prose-sm max-w-none">
        <div className="space-y-0.5">
          {formatMarkdown(analysis.report_summary)}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-bg-2)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--c-text-2)' }}>Full Metrics Reference</p>
        </div>
        <div>
          {Object.values(analysis.metrics).map(m => (
            <div key={m.key} className="grid grid-cols-3 items-start gap-4 px-4 py-3 transition-colors" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>{m.label}</p>
                <p className="text-2xs mt-0.5" style={{ color: 'var(--c-text-5)' }}>{m.unit}</p>
              </div>
              <div>
                <p className="text-sm font-semibold font-numeric" style={{ color: 'var(--c-text-1)' }}>{m.formatted_value}</p>
                <span className={`badge-${m.assessment === 'positive' ? 'green' : m.assessment === 'negative' ? 'red' : m.assessment === 'warning' ? 'amber' : 'neutral'} text-2xs mt-1`}>{m.assessment_label}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-4)' }}>{m.suggested_action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-lg font-semibold font-numeric" style={{ color: 'var(--c-text-1)' }}>{value}</p>
      <p className="text-2xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>{label}</p>
    </div>
  );
}
