import { Settings, PanelRight, Sun, Moon, Home, BarChart3, MessageSquare, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../lib/auth';

interface Props { onHome: () => void; }

export function Header({ onHome }: Props) {
  const { state, dispatch, activeWorkspace } = useApp();
  const { signOut, user } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--c-border)', background: 'var(--c-bg)' }}
    >
      {/* Left: Workspace breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onHome} className="btn-ghost p-1.5 flex-shrink-0" title="Back to home">
          <Home size={14} />
        </button>
        <span style={{ color: 'var(--c-border)' }}>|</span>
        {activeWorkspace ? (
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ color: 'var(--c-text-4)' }}>
              {activeWorkspace.mode === 'analysis' ? <BarChart3 size={14} /> : <MessageSquare size={14} />}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: 'var(--c-text-1)' }}>{activeWorkspace.name}</span>
            {activeWorkspace.is_demo && (
              <span className="badge-neutral text-2xs flex-shrink-0">Demo</span>
            )}
          </div>
        ) : (
          <span className="text-sm" style={{ color: 'var(--c-text-4)' }}>Select or create a workspace</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <span className="text-xs mr-2 hidden sm:block" style={{ color: 'var(--c-text-4)' }}>
          {user?.email}
        </span>
        <button onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} className="btn-ghost p-1.5" title={state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          {state.darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} className="btn-ghost p-1.5" title="Settings">
          <Settings size={15} />
        </button>
        <button onClick={() => dispatch({ type: 'TOGGLE_RIGHT_PANEL' })} className={`btn-ghost p-1.5 ${state.rightPanelOpen ? 'opacity-100' : 'opacity-50'}`} title="Toggle Intelligence Panel">
          <PanelRight size={15} />
        </button>
        <button onClick={signOut} className="btn-ghost p-1.5" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
