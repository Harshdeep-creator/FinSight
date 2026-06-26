import { useState, useCallback } from 'react';
import { Database, RefreshCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UploadArea } from './UploadArea';
import { ProcessingStages } from './ProcessingStages';
import { HealthScore } from './HealthScore';
import { KeyFindings } from './KeyFindings';
import { MetricsGrid } from './MetricsGrid';
import { ForecastingModule } from './ForecastingModule';
import { AnomalyCenter } from './AnomalyCenter';
import { AuditTrail } from './AuditTrail';
import { ScenarioAnalysis } from './ScenarioAnalysis';
import { ReportPanel } from './ReportPanel';
import { ChatInterface } from '../chat/ChatInterface';
import { readFileAsText, parseCSV, detectRetailSchema } from '../../services/csvParser';
import { runFinancialAnalysis } from '../../services/financialCalculations';
import { extractDataFromImage } from '../../services/aiService';
import type { ProcessingState } from '../../types';
import { DEMO_ANALYSIS_RESULT } from '../../data/demoData';

function parseExtractedFinancialData(jsonStr: string): { headers: string[]; rows: Record<string, string>[] } | null {
  try {
    // Try to parse as JSON first
    let jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) jsonMatch = jsonStr.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Handle document extraction format
      if (parsed.document_type && parsed.data) {
        const headers = ['item', 'value', 'category'];
        const rows: Record<string, string>[] = [];

        for (const item of parsed.data) {
          if (item.label && item.value !== undefined) {
            rows.push({
              item: item.label,
              value: String(item.value).replace(/[^0-9.\-]/g, ''),
              category: item.category || 'general'
            });
          }
        }

        if (rows.length > 0) return { headers, rows };
      }

      // Handle array of items
      if (Array.isArray(parsed)) {
        const headers = ['item', 'value', 'category'];
        const rows: Record<string, string>[] = [];

        for (const item of parsed) {
          if (item.label && item.value !== undefined) {
            rows.push({
              item: item.label,
              value: String(item.value).replace(/[^0-9.\-]/g, ''),
              category: item.category || 'general'
            });
          }
        }

        if (rows.length > 0) return { headers, rows };
      }
    }

    // Fallback: try to extract numbers from free-text
    const lines = jsonStr.split('\n').filter(l => l.trim());
    const headers = ['item', 'value', 'category'];
    const rows: Record<string, string>[] = [];

    for (const line of lines) {
      const numMatch = line.match(/(.*?)[\s:]+[\$£€]?([\d,]+(?:\.\d+)?)/);
      if (numMatch) {
        rows.push({
          item: numMatch[1].trim(),
          value: numMatch[2].replace(/,/g, ''),
          category: 'extracted'
        });
      }
    }

    return rows.length > 0 ? { headers, rows } : null;
  } catch {
    return null;
  }
}

type AnalysisTab = 'health' | 'findings' | 'metrics' | 'forecasts' | 'anomalies' | 'scenarios' | 'audit' | 'report' | 'chat';

const TABS: Array<{ id: AnalysisTab; label: string }> = [
  { id: 'health', label: 'Health Score' },
  { id: 'findings', label: 'Key Findings' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'forecasts', label: 'Forecasting' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'report', label: 'Report' },
  { id: 'chat', label: 'Chat' },
];

const STAGE_SEQUENCE: Array<{ stage: ProcessingState['stage']; delay: number; message: string }> = [
  { stage: 'reading', delay: 300, message: 'Reading file structure and encoding...' },
  { stage: 'validating', delay: 600, message: 'Validating columns and data types...' },
  { stage: 'cleaning', delay: 400, message: 'Removing invalid records, handling nulls...' },
  { stage: 'processing', delay: 500, message: 'Extracting transactions and customer records...' },
  { stage: 'calculating', delay: 800, message: 'Computing revenue, returns, growth metrics...' },
  { stage: 'detecting_anomalies', delay: 600, message: 'Running statistical outlier detection...' },
  { stage: 'forecasting', delay: 700, message: 'Building linear regression forecast models...' },
  { stage: 'building_insights', delay: 500, message: 'Synthesizing key findings and risk signals...' },
  { stage: 'generating_report', delay: 400, message: 'Compiling full financial report...' },
  { stage: 'preparing_explanation', delay: 500, message: 'Preparing AI-ready metric explanations...' },
];

export function AnalysisWorkspace() {
  const { activeWorkspace, activeAnalysis, setAnalysisResult, dispatch } = useApp();
  const [tab, setTab] = useState<AnalysisTab>('health');
  const [processing, setProcessing] = useState<ProcessingState>({ stage: 'idle', progress: 0, message: '' });

  const isDemo = activeWorkspace?.is_demo;
  const analysis = isDemo ? DEMO_ANALYSIS_RESULT : activeAnalysis;
  const hasAnalysis = !!analysis;

  const handleFileSelected = useCallback(async (file: File) => {
    if (!activeWorkspace) return;

    const runStages = async (): Promise<void> => {
      for (const s of STAGE_SEQUENCE) {
        setProcessing({ stage: s.stage, progress: 0, message: s.message });
        await new Promise(r => setTimeout(r, s.delay));
      }
    };

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';

    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      webp: 'image/webp', pdf: 'application/pdf',
    };
    const mimeType = mimeMap[ext] || file.type || 'image/jpeg';

    try {
      // Handle image/PDF files with AI extraction
      if (isImage || isPdf) {
        setProcessing({ stage: 'reading', progress: 10, message: isPdf ? 'Extracting PDF content...' : 'Reading image...' });

        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        setProcessing({ stage: 'processing', progress: 30, message: 'Extracting financial data using AI vision...' });

        let extractedData: string;
        try {
          extractedData = await extractDataFromImage(base64, mimeType);
        } catch (extractErr) {
          setProcessing({ stage: 'error', progress: 0, message: '', error: `AI extraction failed: ${extractErr instanceof Error ? extractErr.message : 'Unknown error'}. Both Gemini and Groq were attempted.` });
          return;
        }

        setProcessing({ stage: 'calculating', progress: 50, message: 'Parsing extracted financial data...' });

        // Parse the extracted JSON and create synthetic CSV rows
        const parsedExtraction = parseExtractedFinancialData(extractedData);
        if (!parsedExtraction || parsedExtraction.rows.length === 0) {
          setProcessing({ stage: 'error', progress: 0, message: '', error: 'Could not extract financial data from the image. Please ensure the image contains clear financial information (balance sheet, income statement, etc.).' });
          return;
        }

        await runStages();

        const result = runFinancialAnalysis(
          parsedExtraction.rows,
          parsedExtraction.headers,
          activeWorkspace.id,
          file.name.replace(/\.[^.]+$/, '')
        );

        await setAnalysisResult(activeWorkspace.id, result);
        setProcessing({ stage: 'complete', progress: 100, message: '' });
        setTab('health');
        return;
      }

      // Handle CSV/Excel files
      const stagePromise = runStages();

      const text = await readFileAsText(file);
      const parsed = parseCSV(text);

      if (parsed.rows.length === 0) {
        setProcessing({ stage: 'error', progress: 0, message: '', error: 'No valid data rows found in the file. Please check the file format and try again.' });
        return;
      }

      if (!detectRetailSchema(parsed.headers)) {
        const hasPrice = parsed.headers.some(h => h.toLowerCase().includes('price') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('value') || h.toLowerCase().includes('revenue'));
        const hasQty = parsed.headers.some(h => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('qty') || h.toLowerCase().includes('units'));
        if (!hasPrice && !hasQty) {
          setProcessing({ stage: 'error', progress: 0, message: '', error: `Unable to detect financial columns in this file. Expected: Price/Amount/Revenue and Quantity columns. Found: ${parsed.headers.join(', ')}` });
          return;
        }
      }

      await stagePromise;

      const result = runFinancialAnalysis(parsed.rows, parsed.headers, activeWorkspace.id, file.name.replace(/\.[^.]+$/, ''));

      await setAnalysisResult(activeWorkspace.id, result);

      setProcessing({ stage: 'complete', progress: 100, message: '' });
      setTab('health');

    } catch (err) {
      setProcessing({ stage: 'error', progress: 0, message: '', error: err instanceof Error ? err.message : 'Unexpected error during analysis. Please try again.' });
    }
  }, [activeWorkspace, setAnalysisResult]);

  const handleLoadDemo = useCallback(() => {
    setTab('health');
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: 'demo-workspace' });
    dispatch({ type: 'SET_MODE', payload: 'analysis' });
  }, [dispatch]);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Database size={32} className="mb-4" style={{ color: 'var(--c-text-5)' }} />
        <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--c-text-3)' }}>No workspace selected</h3>
        <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>Create a new Company Analysis workspace from the sidebar.</p>
      </div>
    );
  }

  if (processing.stage !== 'idle' && processing.stage !== 'complete' && processing.stage !== 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <div className="w-full max-w-sm">
          <h3 className="text-sm font-medium text-center mb-6" style={{ color: 'var(--c-text-1)' }}>Analyzing {activeWorkspace?.dataset_name || 'your data'}</h3>
          <ProcessingStages stage={processing.stage} message={processing.message} error={processing.error} />
        </div>
      </div>
    );
  }

  if (processing.stage === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <ProcessingStages stage="error" error={processing.error} />
        <button onClick={() => setProcessing({ stage: 'idle', progress: 0, message: '' })} className="btn-secondary mt-4 text-xs">
          Try Again
        </button>
      </div>
    );
  }

  if (!hasAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 py-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>Upload Financial Data</h3>
            <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>
              Upload a CSV, Excel, PDF, image, or document to begin analysis.
              The financial engine will compute all metrics without requiring an AI key.
            </p>
          </div>
          <UploadArea onFileSelected={handleFileSelected} disabled={processing.stage !== 'idle'} />
          <div className="text-center">
            <button onClick={handleLoadDemo} className="btn-secondary text-xs">
              <Database size={13} />
              Load Demo Dataset (UCI Online Retail II)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Analysis Header */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          {isDemo && <span className="badge-neutral text-2xs">Demo — UCI Online Retail II</span>}
          {!isDemo && analysis && (
            <span className="text-2xs" style={{ color: 'var(--c-text-4)' }}>
              {analysis.raw_stats.total_transactions.toLocaleString()} records analyzed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <button
              onClick={() => setProcessing({ stage: 'idle', progress: 0, message: '' })}
              className="btn-ghost text-xs py-1 px-2"
            >
              <RefreshCcw size={12} />
              Re-analyze
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 overflow-x-auto scrollbar-hide flex-shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
        {TABS.map(t => {
          const anomalyCount = t.id === 'anomalies' ? (analysis?.anomalies.length || 0) : 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-1 py-3 mr-5 text-xs font-medium border-b-2 transition-colors duration-100"
              style={{
                borderColor: tab === t.id ? 'var(--c-text-1)' : 'transparent',
                color: tab === t.id ? 'var(--c-text-1)' : 'var(--c-text-4)'
              }}
            >
              {t.label}
              {anomalyCount > 0 && (
                <span className="w-4 h-4 rounded-full text-2xs flex items-center justify-center font-semibold" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>{anomalyCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`flex-1 ${tab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} px-6 py-5`}>
        {tab !== 'chat' && analysis && (
          <div className="max-w-4xl mx-auto">
            {tab === 'health' && <HealthScore score={analysis.health_score} />}
            {tab === 'findings' && <KeyFindings findings={analysis.key_findings} />}
            {tab === 'metrics' && <MetricsGrid metrics={analysis.metrics} />}
            {tab === 'forecasts' && <ForecastingModule forecasts={analysis.forecasts} />}
            {tab === 'anomalies' && <AnomalyCenter anomalies={analysis.anomalies} />}
            {tab === 'scenarios' && <ScenarioAnalysis analysis={analysis} />}
            {tab === 'audit' && <AuditTrail audit={analysis.audit_trail} />}
            {tab === 'report' && <ReportPanel analysis={analysis} />}
          </div>
        )}
        {tab === 'chat' && (
          <div className="-mx-6 -my-5 h-[calc(100%+40px)]">
            <ChatInterface />
          </div>
        )}
      </div>
    </div>
  );
}
