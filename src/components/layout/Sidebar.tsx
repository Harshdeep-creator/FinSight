import React, { useState } from 'react';
import { Plus, BarChart3, MessageSquare, ChevronDown, Trash2, Edit2, Check, X, Database, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppMode } from '../../types';

interface Props { onHome: () => void; }

export function Sidebar({ onHome }: Props) {
  const { state, dispatch, createWorkspace, deleteWorkspace, renameWorkspace, setActiveWorkspace, loadMessages } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const assistantWs = state.workspaces.filter(w => w.mode === 'assistant');
  const analysisWs  = state.workspaces.filter(w => w.mode === 'analysis');

  const handleCreate = async (mode: AppMode) => {
    setShowMenu(false);
    const name = mode === 'analysis' ? 'New Analysis' : 'New Conversation';
    const ws = await createWorkspace(name, mode);
    setActiveWorkspace(ws.id);
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const handleSelect = (id: string, mode: 'assistant' | 'analysis') => {
    setActiveWorkspace(id);
    dispatch({ type: 'SET_MODE', payload: mode });
    loadMessages(id);
  };

  const startEdit = (id: string, name: string) => {
    if (id === 'demo-workspace') return;
    setEditingId(id); setEditName(name);
  };

  const commitEdit = async () => {
    if (editingId && editName.trim()) await renameWorkspace(editingId, editName.trim());
    setEditingId(null); setEditName('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'demo-workspace') return;
    await deleteWorkspace(id);
  };

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 'var(--sidebar-width)', background: 'var(--c-bg-2)', borderRight: '1px solid var(--c-border)' }}
    >
      {/* Logo */}
      <button
        onClick={onHome}
        className="flex items-center gap-2.5 px-4 py-3.5 w-full text-left hover:opacity-80 transition-opacity"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-md" style={{ background: 'var(--c-text-1)' }}>
          <TrendingUp size={14} style={{ color: 'var(--c-bg)' }} />
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--c-text-1)' }}>FinSight</span>
      </button>

      {/* New button */}
      <div className="px-3 pt-3 pb-2 relative">
        <button onClick={() => setShowMenu(!showMenu)} className="btn-primary w-full justify-between text-xs py-1.5 px-3">
          <span className="flex items-center gap-1.5"><Plus size={13} /> New</span>
          <ChevronDown size={12} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>
        {showMenu && (
          <div className="absolute top-full left-3 right-3 mt-1 rounded-md shadow-md z-50 animate-fade-in overflow-hidden"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <button onClick={() => handleCreate('assistant')} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
              style={{ color: 'var(--c-text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MessageSquare size={13} style={{ color: 'var(--c-text-4)' }} /> Financial Assistant
            </button>
            <div style={{ borderTop: '1px solid var(--c-border)' }} />
            <button onClick={() => handleCreate('analysis')} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
              style={{ color: 'var(--c-text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <BarChart3 size={13} style={{ color: 'var(--c-text-4)' }} /> Company Analysis
            </button>
          </div>
        )}
      </div>
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 scrollbar-hide">
        {analysisWs.length > 0 && (
          <div>
            <div className="px-2 pt-3 pb-1.5"><span className="section-title">Analysis</span></div>
            <div className="space-y-0.5">
              {analysisWs.map(ws => (
                <WsItem key={ws.id} ws={ws} isActive={state.activeWorkspaceId === ws.id}
                  isEditing={editingId === ws.id} editName={editName}
                  onSelect={() => handleSelect(ws.id, ws.mode)}
                  onStartEdit={() => startEdit(ws.id, ws.name)}
                  onEditChange={setEditName} onCommitEdit={commitEdit}
                  onCancelEdit={() => setEditingId(null)} onDelete={e => handleDelete(ws.id, e)}
                  icon={ws.is_demo ? <Database size={12} /> : <BarChart3 size={12} />} />
              ))}
            </div>
          </div>
        )}
        {assistantWs.length > 0 && (
          <div>
            <div className="px-2 pt-1 pb-1.5"><span className="section-title">Assistant</span></div>
            <div className="space-y-0.5">
              {assistantWs.map(ws => (
                <WsItem key={ws.id} ws={ws} isActive={state.activeWorkspaceId === ws.id}
                  isEditing={editingId === ws.id} editName={editName}
                  onSelect={() => handleSelect(ws.id, ws.mode)}
                  onStartEdit={() => startEdit(ws.id, ws.name)}
                  onEditChange={setEditName} onCommitEdit={commitEdit}
                  onCancelEdit={() => setEditingId(null)} onDelete={e => handleDelete(ws.id, e)}
                  icon={<MessageSquare size={12} />} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--c-border)' }}>
        <p className="text-2xs text-center" style={{ color: 'var(--c-text-4)' }}>Made by Harshdeep Singh</p>
      </div>
    </aside>
  );
}

interface WsItemProps {
  ws: { id: string; name: string; is_demo: boolean; dataset_name: string | null; dataset_rows: number | null };
  isActive: boolean; isEditing: boolean; editName: string;
  onSelect: () => void; onStartEdit: () => void; onEditChange: (v: string) => void;
  onCommitEdit: () => void; onCancelEdit: () => void; onDelete: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
}

function WsItem({ ws, isActive, isEditing, editName, onSelect, onStartEdit, onEditChange, onCommitEdit, onCancelEdit, onDelete, icon }: WsItemProps) {
  return (
    <div
      className="group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-100"
      style={{ background: isActive ? 'var(--c-bg-4)' : 'transparent', color: isActive ? 'var(--c-text-1)' : 'var(--c-text-3)' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--c-bg-3)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      onClick={onSelect}
    >
      <span className="flex-shrink-0" style={{ color: isActive ? 'var(--c-text-2)' : 'var(--c-text-4)' }}>{icon}</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input autoFocus value={editName} onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit(); }}
            className="flex-1 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 min-w-0"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border-2)', color: 'var(--c-text-1)' }} />
          <button onClick={onCommitEdit} className="text-green-500 hover:text-green-400"><Check size={11} /></button>
          <button onClick={onCancelEdit} style={{ color: 'var(--c-text-4)' }}><X size={11} /></button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs truncate">{ws.name}</span>
              {ws.is_demo && <span className="flex-shrink-0 text-2xs px-1 rounded font-medium" style={{ background: 'var(--c-bg-4)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}>demo</span>}
            </div>
            {ws.dataset_name && <p className="text-2xs truncate" style={{ color: 'var(--c-text-4)' }}>{ws.dataset_rows?.toLocaleString()} rows</p>}
          </div>
          <div className="flex-shrink-0 hidden group-hover:flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            {!ws.is_demo && (
              <button onClick={onStartEdit} className="p-0.5 rounded transition-colors" style={{ color: 'var(--c-text-4)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-text-1)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-4)')}>
                <Edit2 size={10} />
              </button>
            )}
            {!ws.is_demo && (
              <button onClick={onDelete} className="p-0.5 rounded transition-colors text-red-400 hover:text-red-300">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
