import { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, BarChart3, ShieldCheck, GitBranch, FileSearch, Zap, Sun, Moon } from 'lucide-react';

interface Props {
  onEnter: () => void;
  onViewDemo: () => void;
}

const METRICS = [
  { label: 'Net Revenue', value: '£8,022,510', sub: 'after returns', status: 'Strong', color: '#16a34a' },
  { label: 'Health Score', value: '74 / 100', sub: 'Grade: Good', status: 'Good', color: '#16a34a' },
  { label: 'Returns Rate', value: '8.47%', sub: 'above benchmark', status: 'Warning', color: '#d97706' },
  { label: 'Revenue CMGR', value: '6.2%', sub: '13-month trend', status: 'Exceptional', color: '#16a34a' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Financial Engine', desc: 'Revenue, margins, growth, and cash flow — computed from your data, not estimated.' },
  { icon: ShieldCheck, title: 'Anomaly Detection', desc: 'Statistical outlier detection flags suspicious transactions and concentration risks.' },
  { icon: TrendingUp, title: 'Cash Flow Forecasting', desc: 'Confidence-bounded forecasts with explicit uncertainty disclosure at every horizon.' },
  { icon: FileSearch, title: 'Audit Trail', desc: 'Every conclusion traces to source data, formulas, and documented reasoning.' },
  { icon: GitBranch, title: 'Scenario Analysis', desc: 'Modify assumptions and instantly see the downstream impact on all financial metrics.' },
  { icon: Zap, title: 'AI Explanation Layer', desc: 'The financial engine computes first. AI explains second — grounded in evidence.' },
];

const PIPELINE = ['Reading File', 'Validating', 'Cleaning', 'Processing', 'Calculating Metrics', 'Anomaly Detection', 'Forecasting', 'Building Insights', 'Report Generation', 'AI Explanation'];

const HOW_IT_WORKS = [
  { n: '01', l: 'Upload', d: 'CSV, Excel, PDF, Image, or text — we extract financial data from any format' },
  { n: '02', l: 'Analyze', d: 'The financial engine runs 10 computation stages on your data' },
  { n: '03', l: 'Understand', d: 'Every metric explained with evidence, meaning, and recommended action' },
  { n: '04', l: 'Decide', d: 'Scenario analysis and forecasting ground decisions in quantified outcomes' },
];

export function Landing({ onEnter, onViewDemo }: Props) {
  const [dark, setDark] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const go = (fn: () => void) => {
    setLeaving(true);
    setTimeout(fn, 280);
  };

  const bg        = dark ? '#0a0a0a' : '#ffffff';
  const text1     = dark ? '#f5f5f5' : '#0a0a0a';
  const text2     = dark ? '#a8a8a8' : '#525252';
  const text3     = dark ? '#717171' : '#737373';
  const border    = dark ? '#333333' : '#d9d9d9';
  const cardBg    = dark ? '#181818' : '#ffffff';
  const cardBorder = dark ? '#333333' : '#d9d9d9';
  const navBg     = dark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)';
  const stripBg   = dark ? '#141414' : '#f7f7f7';
  const pipeBg    = dark ? '#111111' : '#1a1a1a';
  const pipeCardBg = dark ? '#1e1e1e' : '#2a2a2a';
  const pipeCardBorder = dark ? '#2e2e2e' : '#383838';
  const numColor  = dark ? '#888888' : '#a0a0a0';
  const primaryBg = dark ? '#f5f5f5' : '#0a0a0a';
  const primaryText = dark ? '#0a0a0a' : '#f5f5f5';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text1, transition: 'opacity 0.28s', opacity: leaving ? 0 : 1 }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: navBg, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: text1 }}>
              <TrendingUp size={14} style={{ color: bg }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', color: text1 }}>FinSight</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: text3 }}>AI Financial Intelligence</span>
            <button
              onClick={() => setDark(d => !d)}
              style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: text2, display: 'flex', alignItems: 'center' }}
              title="Toggle theme"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => go(onEnter)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: primaryBg, color: primaryText }}
            >
              Open Platform <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '144px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', marginBottom: '32px', background: dark ? '#1e1e1e' : '#f0f0f0', border: `1px solid ${border}`, color: text2 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Online Retail II — 117,379 records, fully analyzed
          </div>

          <h1 style={{ fontSize: 'clamp(38px, 6vw, 60px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '24px', color: text1 }}>
            Analyze.{' '}<span style={{ color: text2 }}>Understand.</span>{' '}Decide.
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 40px', color: text2 }}>
            Analyze companies, forecast cash flow, detect risk, and generate explainable financial insights powered by AI.
            Every number traced to its source. Every conclusion backed by evidence.
          </p>

          <button
            onClick={() => go(onViewDemo)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', background: primaryBg, color: primaryText }}
          >
            View Demo <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Demo Metrics Strip */}
      <section style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: '40px 24px', background: stripBg }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '24px', color: text3 }}>
            Live analysis — UCI Online Retail II dataset
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {METRICS.map(m => (
              <div key={m.label} style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, padding: '16px', background: cardBg }}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', color: text3 }}>{m.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 600, color: text1, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{m.value}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: text3 }}>{m.sub}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: m.color }}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
          {[['10', 'Analysis pipeline stages'], ['100%', 'Evidence-grounded conclusions'], ['0', 'Hallucinated financial claims']].map(([v, l]) => (
            <div key={l}>
              <p style={{ fontSize: '42px', fontWeight: 700, marginBottom: '6px', color: text1 }}>{v}</p>
              <p style={{ fontSize: '12px', color: text2 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '64px 24px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: stripBg }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px', color: text1 }}>The system analyzes first. The AI explains second.</h2>
            <p style={{ fontSize: '14px', color: text2 }}>Backend intelligence generates all metrics before the AI layer provides humanized interpretation.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>
            {HOW_IT_WORKS.map(({ n, l, d }) => (
              <div key={n}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: numColor, display: 'block', lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>{n}</span>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: text1 }}>{l}</h3>
                <p style={{ fontSize: '12px', lineHeight: 1.65, color: text2 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px', color: text1 }}>Everything you need to understand a business</h2>
            <p style={{ fontSize: '14px', color: text2 }}>Designed specifically for financial intelligence</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ borderRadius: '12px', border: `1px solid ${cardBorder}`, padding: '20px', background: cardBg }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', background: dark ? '#2a2a2a' : '#f0f0f0' }}>
                    <Icon size={16} style={{ color: text2 }} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: text1 }}>{f.title}</h3>
                  <p style={{ fontSize: '12px', lineHeight: 1.65, color: text2 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section style={{ padding: '64px 24px', background: pipeBg }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f0', marginBottom: '8px' }}>Analysis Pipeline</h2>
            <p style={{ fontSize: '12px', color: '#888888' }}>10 computation stages. Complete transparency at every step.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {PIPELINE.map((stage, i) => (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${pipeCardBorder}`, background: pipeCardBg }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#666666', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '11px', color: '#b0b0b0' }}>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: bg }}>
        <div style={{ maxWidth: '512px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '12px', color: text1 }}>Start with the demo</h2>
          <p style={{ fontSize: '14px', marginBottom: '32px', lineHeight: 1.7, color: text2 }}>
            The UCI Online Retail II dataset — 117,379 transactions — is fully analyzed and ready to explore.
            No file upload required.
          </p>
          <button
            onClick={() => go(onViewDemo)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 36px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', background: primaryBg, color: primaryText }}
          >
            View Demo <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: text1 }}>
              <TrendingUp size={10} style={{ color: bg }} />
            </div>
            <span style={{ fontSize: '12px', color: text2 }}>FinSight</span>
          </div>
          <p style={{ fontSize: '12px', color: text3 }}>Made by Harshdeep Singh</p>
        </div>
      </footer>
    </div>
  );
}
