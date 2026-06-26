import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ProcessingStage } from '../../types';

const STAGES: Array<{ id: ProcessingStage; label: string; description: string }> = [
  { id: 'reading', label: 'Reading File', description: 'Parsing file structure and headers' },
  { id: 'validating', label: 'Validating Structure', description: 'Checking schema and field types' },
  { id: 'cleaning', label: 'Cleaning Data', description: 'Removing invalid records and anomalies' },
  { id: 'processing', label: 'Processing Records', description: 'Extracting transactions and customers' },
  { id: 'calculating', label: 'Calculating Financial Metrics', description: 'Revenue, margins, growth rates' },
  { id: 'detecting_anomalies', label: 'Detecting Anomalies', description: 'Statistical outlier analysis' },
  { id: 'forecasting', label: 'Forecasting', description: 'Cash flow and revenue projections' },
  { id: 'building_insights', label: 'Building Insights', description: 'Key findings and risk assessment' },
  { id: 'generating_report', label: 'Generating Report', description: 'Compiling full financial report' },
  { id: 'preparing_explanation', label: 'Preparing AI Explanation', description: 'Humanizing metrics and findings' },
];

const STAGE_ORDER = STAGES.map(s => s.id);

interface Props {
  stage: ProcessingStage;
  message?: string;
  error?: string;
}

export function ProcessingStages({ stage, message, error }: Props) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (stage === 'complete' || stage === 'idle' || stage === 'error') return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, [stage]);

  const currentIdx = STAGE_ORDER.indexOf(stage);

  if (stage === 'idle') return null;

  if (stage === 'error') {
    return (
      <div className="flex flex-col items-center py-12 animate-fade-in">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
          <span className="text-red-500 text-lg font-medium">!</span>
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--c-text-1)' }}>Analysis Failed</p>
        <p className="text-xs text-center max-w-sm" style={{ color: 'var(--c-text-4)' }}>{error || 'An unexpected error occurred. Please try again.'}</p>
      </div>
    );
  }

  if (stage === 'complete') return null;

  return (
    <div className="w-full max-w-md mx-auto py-8 animate-fade-in">
      <div className="space-y-3">
        {STAGES.map((s, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={s.id}
              className="flex items-center gap-3 transition-opacity duration-200"
              style={{ opacity: isPending ? 0.3 : 1 }}
            >
              {/* Status indicator */}
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: isDone ? '#22c55e' : isCurrent ? 'var(--c-bg)' : 'var(--c-bg-3)',
                  border: isDone ? 'none' : isCurrent ? '2px solid var(--c-text-1)' : '1px solid var(--c-border)'
                }}
              >
                {isDone && <Check size={11} className="text-white" strokeWidth={3} />}
                {isCurrent && <Loader2 size={10} className="animate-spin" style={{ color: 'var(--c-text-1)' }} />}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{ color: isCurrent ? 'var(--c-text-1)' : isDone ? 'var(--c-text-3)' : 'var(--c-text-5)' }}
                >
                  {s.label}{isCurrent ? dots : ''}
                </p>
                {isCurrent && (
                  <p className="text-2xs mt-0.5 animate-fade-in" style={{ color: 'var(--c-text-4)' }}>
                    {message || s.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
