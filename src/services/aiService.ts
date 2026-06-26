import type { AnalysisResult } from '../types';

export interface AIConfig {
  geminiKey?: string;
  groqKey?: string;
}

let config: AIConfig = {};

export function configureAI(cfg: AIConfig) {
  config = cfg;
}

const FINANCE_SYSTEM_PROMPT = `You are FinSight's AI Financial CFO Assistant. You are a senior financial analyst.

ABSOLUTE RULES — never break these:
1. ONLY respond to finance, economics, accounting, investment, business, or market-related topics.
2. If asked about anything outside finance, reply: "I can only assist with financial topics. Please ask me something related to finance, accounting, investment, or business analysis."
3. Never invent financial advice without evidence. If no data is provided, say so explicitly.
4. When data is available, ground ALL responses in that data — cite specific numbers, formulas, and metrics.
5. Explain the financial meaning behind every number. Never present a metric without explaining what it means.
6. When uncertain, state your confidence level. Never present projections as certainties.
7. Always explain HOW you arrived at a conclusion — trace the logic.`;

const ANALYSIS_SYSTEM_PROMPT = `You are FinSight's Company Analysis AI. You analyze uploaded financial data.

ABSOLUTE RULES:
1. Only discuss the uploaded dataset and financial concepts related to it.
2. Ground all responses in the computed metrics provided in context.
3. When the user asks about specific numbers, cite the exact figures from the analysis.
4. If the user asks "what if" questions, acknowledge you're doing scenario analysis and explain the impact logically based on the metrics.
5. If asked about something not covered by the data, say: "The uploaded dataset doesn't contain sufficient data to answer this. Here's what I can tell you from the available data..."
6. Always explain the financial significance of findings — not just the numbers.
7. Remember previous conversation turns and maintain context.`;

const VISION_EXTRACT_PROMPT = `Extract all financial data from this image. The image contains financial statements or documents.

Return a JSON object with:
{
  "document_type": "balance sheet|income statement|cash flow|other",
  "company_name": "company name if visible",
  "period": "reporting period if visible",
  "currency": "USD|GBP|EUR etc",
  "data": [
    {"label": "item name", "value": 12345, "category": "asset|liability|equity|revenue|expense|other", "notes": "any notes"}
  ],
  "summary": "brief description of the document"
}

Extract ALL numbers visible. Use numeric values only (no currency symbols in value field). If a value is negative, use a negative number.`;

function buildAnalysisContext(analysis: AnalysisResult): string {
  const { health_score, metrics, key_findings, anomalies, raw_stats } = analysis;
  return `
DATASET: ${analysis.audit_trail.dataset_name}
RECORDS: ${raw_stats.total_transactions.toLocaleString()}
ANALYSIS DATE: ${new Date(analysis.created_at).toLocaleDateString()}

HEALTH SCORE: ${health_score.overall}/100 (${health_score.grade})
Sub-scores: Profitability=${health_score.profitability}, Growth=${health_score.growth}, Liquidity=${health_score.liquidity}, Cash Position=${health_score.cash_position}, Risk=${health_score.risk_exposure}

KEY METRICS:
${Object.values(metrics).slice(0, 8).map(m => `- ${m.label}: ${m.formatted_value} (${m.assessment_label})`).join('\n')}

KEY FINDINGS:
${key_findings.map((f, i) => `${i + 1}. [${f.type.toUpperCase()}] ${f.title}: ${f.description.slice(0, 150)}...`).join('\n')}

ANOMALIES (${anomalies.length} detected):
${anomalies.slice(0, 3).map(a => `- [${a.severity.toUpperCase()}] ${a.description}`).join('\n')}

RAW STATS:
- Net Revenue: ${raw_stats.total_revenue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
- Customers: ${raw_stats.unique_customers.toLocaleString()}
- Products: ${raw_stats.unique_products.toLocaleString()}
- Returns: ${raw_stats.returns_count.toLocaleString()} (${raw_stats.returns_value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })})
- Avg Order Value: £${raw_stats.avg_order_value}
`;
}

async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  contextStr: string
): Promise<string> {
  if (!config.geminiKey) throw new Error('no_gemini_key');

  const allMessages = [
    { role: 'user', parts: [{ text: systemPrompt + (contextStr ? `\n\nCURRENT ANALYSIS CONTEXT:\n${contextStr}` : '') + '\n\nAcknowledge you are ready.' }] },
    { role: 'model', parts: [{ text: 'I am ready to assist with financial analysis.' }] },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: allMessages, generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`gemini_error:${response.status}:${JSON.stringify(err)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_empty_response');
  return text;
}

async function callGroq(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  contextStr: string
): Promise<string> {
  if (!config.groqKey) throw new Error('no_groq_key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt + (contextStr ? `\n\nCURRENT ANALYSIS CONTEXT:\n${contextStr}` : '') },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`groq_error:${response.status}:${JSON.stringify(err)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('groq_empty_response');
  return text;
}

export async function getAssistantResponse(
  messages: Array<{ role: string; content: string }>,
  mode: 'assistant' | 'analysis',
  analysis?: AnalysisResult
): Promise<string> {
  const systemPrompt = mode === 'analysis' ? ANALYSIS_SYSTEM_PROMPT : FINANCE_SYSTEM_PROMPT;
  const contextStr = analysis ? buildAnalysisContext(analysis) : '';

  if (config.geminiKey) {
    try { return await callGemini(systemPrompt, messages, contextStr); } catch { /* fall through */ }
  }
  if (config.groqKey) {
    try { return await callGroq(systemPrompt, messages, contextStr); } catch { /* fall through */ }
  }
  return generateFallbackResponse(messages[messages.length - 1]?.content || '', mode, analysis);
}

async function extractWithGeminiVision(imageBase64: string, mimeType: string): Promise<string> {
  if (!config.geminiKey) throw new Error('no_gemini_key');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: VISION_EXTRACT_PROMPT },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`gemini_vision_error:${response.status}:${JSON.stringify(err)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_vision_empty');
  return text;
}

async function extractWithGroqVision(imageBase64: string, mimeType: string): Promise<string> {
  if (!config.groqKey) throw new Error('no_groq_key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqKey}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.1,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: VISION_EXTRACT_PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`groq_vision_error:${response.status}:${JSON.stringify(err)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('groq_vision_empty');
  return text;
}

export async function extractDataFromImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  // Try Gemini Vision first
  if (config.geminiKey) {
    try { return await extractWithGeminiVision(imageBase64, mimeType); } catch { /* fall through to Groq */ }
  }

  // Fall back to Groq Vision (Llama 4 Scout supports images)
  if (config.groqKey) {
    try { return await extractWithGroqVision(imageBase64, mimeType); } catch (err) {
      throw new Error(`Image analysis failed with both providers. ${err}`);
    }
  }

  throw new Error('No AI API key configured. Please check Settings.');
}

function generateFallbackResponse(question: string, mode: 'assistant' | 'analysis', analysis?: AnalysisResult): string {
  const lq = question.toLowerCase();

  if (mode === 'analysis' && analysis) {
    const { health_score, metrics, raw_stats } = analysis;

    if (lq.includes('revenue') || lq.includes('sales')) {
      const m = metrics['net_revenue'] || metrics['gross_revenue'];
      return `Based on the analysis of ${analysis.audit_trail.dataset_name}:\n\n**Net Revenue: ${m?.formatted_value || 'N/A'}**\n\n${m?.meaning || ''}\n\n${m?.evidence || ''}\n\nThe revenue growth rate (CMGR) stands at ${metrics['revenue_growth_rate']?.formatted_value || 'N/A'}, which is ${metrics['revenue_growth_rate']?.assessment_label || 'N/A'}.`;
    }
    if (lq.includes('health') || lq.includes('score')) {
      return `**Financial Health Score: ${health_score.overall}/100 (${health_score.grade.toUpperCase()})**\n\n${health_score.summary}\n\n**Sub-scores:**\n- Profitability: ${health_score.profitability}/100\n- Growth: ${health_score.growth}/100\n- Liquidity: ${health_score.liquidity}/100\n- Cash Position: ${health_score.cash_position}/100\n- Risk Exposure: ${health_score.risk_exposure}/100`;
    }
    if (lq.includes('customer')) {
      return `**Customer Analysis from ${analysis.audit_trail.dataset_name}:**\n\n- Unique Customers: ${raw_stats.unique_customers.toLocaleString()}\n- Average Order Value: £${raw_stats.avg_order_value}\n- ${metrics['customer_concentration_ratio']?.label}: ${metrics['customer_concentration_ratio']?.formatted_value} (${metrics['customer_concentration_ratio']?.assessment_label})`;
    }
    return `Based on the analysis of **${analysis.audit_trail.dataset_name}** (${raw_stats.total_transactions.toLocaleString()} records):\n\n**Health Score:** ${health_score.overall}/100 — ${health_score.summary}\n\n**Available metrics:** ${Object.keys(metrics).join(', ')}`;
  }

  if (mode === 'assistant') {
    const financeTopics = ['revenue', 'profit', 'loss', 'margin', 'cash', 'flow', 'balance', 'debt', 'equity', 'investment', 'return', 'growth', 'valuation', 'roe', 'roa', 'ebitda', 'earnings', 'dividend', 'bond', 'stock', 'market', 'inflation', 'interest', 'rate', 'credit', 'risk', 'portfolio', 'asset', 'liability', 'financial'];
    const isFinancial = financeTopics.some(t => lq.includes(t));
    if (!isFinancial) return 'I can only assist with financial topics. Please ask me something related to finance, accounting, investment, or business analysis.';
    return `I can help with your financial question. To provide accurate, grounded answers, please configure an API key in Settings, or upload financial data for analysis.\n\n*Configure an API key for full AI-powered responses.*`;
  }

  return 'Please configure an AI API key in Settings to enable AI responses.';
}
