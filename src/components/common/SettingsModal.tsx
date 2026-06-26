import { useState } from 'react';
import { X, Check, Zap, Key, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { configureAI } from '../../services/aiService';

export function SettingsModal() {
  const { state, dispatch } = useApp();
  const [useCustomKey, setUseCustomKey] = useState(!!state.userGeminiKey || !!state.userGroqKey);
  const [customKey, setCustomKey] = useState(state.userGeminiKey || state.userGroqKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (useCustomKey && customKey.trim()) {
      // Detect key type by prefix and set appropriately
      const isGroq = customKey.trim().startsWith('gsk_');
      const geminiKey = isGroq ? '' : customKey.trim();
      const groqKey = isGroq ? customKey.trim() : '';
      dispatch({ type: 'SET_USER_KEYS', payload: { geminiKey, groqKey } });
      configureAI({
        geminiKey: geminiKey || undefined,
        groqKey: groqKey || undefined,
      });
    } else {
      // Use built-in default keys
      dispatch({ type: 'SET_USER_KEYS', payload: { geminiKey: '', groqKey: '' } });
      const defaultGemini = import.meta.env.VITE_GEMINI_KEY;
      const defaultGroq = import.meta.env.VITE_GROQ_KEY;
      configureAI({ geminiKey: defaultGemini || undefined, groqKey: defaultGroq || undefined });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); dispatch({ type: 'TOGGLE_SETTINGS' }); }, 1200);
  };

  if (!state.settingsOpen) return null;

  const hasBuiltInKeys = !!(import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GROQ_KEY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="absolute inset-0" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} />
      <div className="relative w-full max-w-md rounded-xl shadow-2xl animate-fade-in mx-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--c-text-1)' }}>Settings</h2>
          <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} className="btn-ghost p-1">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* AI Key Source */}
          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--c-text-3)' }}>AI Configuration</h3>

            {/* Option 1: Default / Built-in */}
            <div
              className="flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-all mb-2"
              style={{
                background: !useCustomKey ? 'var(--c-bg-3)' : 'var(--c-bg-2)',
                border: !useCustomKey ? '2px solid var(--c-text-1)' : '2px solid var(--c-border)',
              }}
              onClick={() => setUseCustomKey(false)}
            >
              <div
                className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center"
                style={{ background: !useCustomKey ? 'var(--c-text-1)' : 'transparent', border: !useCustomKey ? 'none' : '2px solid var(--c-border-2)' }}
              >
                {!useCustomKey && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-bg)' }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>Built-in AI Keys</span>
                  {hasBuiltInKeys && (
                    <span className="badge-green text-2xs">Active</span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
                  Use platform AI keys. Everything works out of the box — no setup required.
                </p>
                {hasBuiltInKeys && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium" style={{ color: '#22c55e' }}>AI ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Custom Key */}
            <div
              className="flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-all"
              style={{
                background: useCustomKey ? 'var(--c-bg-3)' : 'var(--c-bg-2)',
                border: useCustomKey ? '2px solid var(--c-text-1)' : '2px solid var(--c-border)',
              }}
              onClick={() => setUseCustomKey(true)}
            >
              <div
                className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center"
                style={{ background: useCustomKey ? 'var(--c-text-1)' : 'transparent', border: useCustomKey ? 'none' : '2px solid var(--c-border-2)' }}
              >
                {useCustomKey && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-bg)' }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Key size={12} style={{ color: 'var(--c-text-2)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>My Own API Key</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
                  Use your personal Gemini or Groq key. Your key overrides the platform default.
                </p>

                {useCustomKey && (
                  <div className="mt-3" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={customKey}
                        onChange={e => setCustomKey(e.target.value)}
                        placeholder="AIza... or gsk_..."
                        className="input-base pr-10 font-mono text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--c-text-4)' }}
                      >
                        {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <p className="text-2xs mt-1.5" style={{ color: 'var(--c-text-5)' }}>
                      Gemini keys start with AIza. Groq keys start with gsk_. Auto-detected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 p-3 rounded-md" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}>
            <Zap size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
              Financial calculations run entirely in the browser — no AI key needed for analysis. Keys are only used to generate conversational AI explanations.
            </p>
          </div>

          {/* About */}
          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '1rem' }}>
            <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--c-text-3)' }}>About FinSight</h3>
            <div className="space-y-1 text-2xs" style={{ color: 'var(--c-text-5)' }}>
              <p>Version 1.0.0 — Financial Intelligence Platform</p>
              <p>Built by Harshdeep Singh</p>
              <p>All financial calculations run client-side. Data is not sent externally without your consent.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} className="btn-ghost text-xs">Cancel</button>
          <button onClick={handleSave} className="btn-primary text-xs py-1.5 px-4">
            {saved ? <><Check size={13} /> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
