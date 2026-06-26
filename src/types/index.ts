export type AppMode = 'assistant' | 'analysis';

export type WorkspaceMode = 'assistant' | 'analysis';

export interface Workspace {
  id: string;
  name: string;
  mode: WorkspaceMode;
  is_demo: boolean;
  dataset_name: string | null;
  dataset_rows: number | null;
  last_analysis_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  workspace_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface HealthScore {
  overall: number;
  profitability: number;
  liquidity: number;
  growth: number;
  cash_position: number;
  risk_exposure: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
}

export interface FinancialMetric {
  key: string;
  label: string;
  value: number | string;
  formatted_value: string;
  unit: string;
  meaning: string;
  assessment: 'positive' | 'neutral' | 'negative' | 'warning';
  assessment_label: string;
  evidence: string;
  suggested_action: string;
  calculation_path: string;
  confidence: number;
}

export interface KeyFinding {
  id: string;
  type: 'risk' | 'opportunity' | 'insight' | 'warning';
  title: string;
  description: string;
  evidence: string;
  impact: 'high' | 'medium' | 'low';
  metric_references: string[];
}

export interface ForecastPoint {
  period: string;
  value: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_score: number;
}

export interface Forecast {
  metric: string;
  label: string;
  horizon: '3m' | '6m' | '12m';
  method: string;
  assumptions: string[];
  data_points: ForecastPoint[];
  confidence_score: number;
  explanation: string;
}

export interface Anomaly {
  id: string;
  field: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  impact: string;
  investigation_recommendation: string;
  period?: string;
  value?: number | string;
  expected_range?: string;
}

export interface AuditStep {
  step: number;
  action: string;
  data_source: string;
  formula?: string;
  result: string;
  metrics_involved: string[];
  reasoning: string;
}

export interface AuditTrail {
  analysis_id: string;
  dataset_name: string;
  total_records: number;
  valid_records: number;
  data_quality_score: number;
  steps: AuditStep[];
  conclusion: string;
  generated_at: string;
}

export interface ScenarioVariable {
  key: string;
  label: string;
  current_value: number;
  modified_value: number;
  unit: string;
  impact_factor: number;
}

export interface ScenarioResult {
  id: string;
  workspace_id: string;
  name: string;
  variables: ScenarioVariable[];
  base_metrics: Partial<Record<string, number>>;
  scenario_metrics: Partial<Record<string, number>>;
  changes: Array<{ metric: string; label: string; base: number; scenario: number; delta: number; delta_pct: number; driver: string }>;
  interpretation: string;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  workspace_id: string;
  version: number;
  health_score: HealthScore;
  key_findings: KeyFinding[];
  metrics: Record<string, FinancialMetric>;
  forecasts: Record<string, Forecast>;
  anomalies: Anomaly[];
  audit_trail: AuditTrail;
  report_summary: string;
  raw_stats: RawStats;
  created_at: string;
}

export interface RawStats {
  total_revenue: number;
  total_transactions: number;
  unique_customers: number;
  unique_products: number;
  date_range: { start: string; end: string };
  countries: string[];
  top_products: Array<{ name: string; revenue: number; quantity: number }>;
  top_customers: Array<{ id: string; revenue: number; orders: number }>;
  monthly_revenue: Array<{ period: string; revenue: number; transactions: number }>;
  returns_count: number;
  returns_value: number;
  avg_order_value: number;
  avg_items_per_order: number;
}

export type ProcessingStage =
  | 'idle'
  | 'reading'
  | 'validating'
  | 'cleaning'
  | 'processing'
  | 'calculating'
  | 'detecting_anomalies'
  | 'forecasting'
  | 'building_insights'
  | 'generating_report'
  | 'preparing_explanation'
  | 'complete'
  | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  message: string;
  error?: string;
}

export interface ChatContext {
  analysis_result: AnalysisResult | null;
  workspace: Workspace | null;
}

export type RightPanelTab = 'overview' | 'alerts' | 'forecasts';
