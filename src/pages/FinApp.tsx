import { useEffect, useState } from 'react';
import { X, Settings2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { RightPanel } from '../components/layout/RightPanel';
import { ChatInterface } from '../components/chat/ChatInterface';
import { AnalysisWorkspace } from '../components/analysis/AnalysisWorkspace';
import { SettingsModal } from '../components/common/SettingsModal';
import { useApp } from '../context/AppContext';

interface Props {
  onHome: () => void;
  startDemo: boolean;
}

export function FinApp({ onHome, startDemo }: Props) {
  const { state, dispatch, setActiveWorkspace } = useApp();
  const [keyBanner, setKeyBanner] = useState(!state.userGeminiKey && !state.userGroqKey);

  // Jump straight to demo if requested
  useEffect(() => {
    if (startDemo) {
      setActiveWorkspace('demo-workspace');
      dispatch({ type: 'SET_MODE', payload: 'analysis' });
    }
  }, [startDemo]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)', color: 'var(--c-text-1)' }}>

      {/* API key banner */}
      {keyBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-2.5 text-xs font-medium"
          style={{ background: 'var(--c-bg-3)', borderBottom: '1px solid var(--c-border)' }}>
          <span style={{ color: 'var(--c-text-2)' }}>
            Platform AI keys active — everything works out of the box.{' '}
            <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2" style={{ color: 'var(--c-text-1)' }}>
              <Settings2 size={11} /> Open Settings
            </button>
            {' '}to use your own API key.
          </span>
          <button onClick={() => setKeyBanner(false)} className="flex-shrink-0 ml-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--c-text-3)' }}>
            <X size={13} />
          </button>
        </div>
      )}

      <div className={`flex h-full w-full ${keyBanner ? 'pt-9' : ''}`}>
        {/* Left Sidebar */}
        <Sidebar onHome={onHome} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header onHome={onHome} />

          <div className="flex flex-1 min-h-0">
            {/* Center */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {state.mode === 'assistant' ? <ChatInterface /> : <AnalysisWorkspace />}
            </main>

            {/* Right Panel */}
            {state.rightPanelOpen && <RightPanel />}
          </div>
        </div>
      </div>

      <SettingsModal />
    </div>
  );
}
