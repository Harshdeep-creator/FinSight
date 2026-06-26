import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { Workspace, Message, AnalysisResult, ProcessingState, AppMode } from '../types';
import { supabase } from '../lib/supabase';
import { DEMO_ANALYSIS_RESULT, DEMO_WORKSPACE_ID, DEMO_WORKSPACE_NAME } from '../data/demoData';
import { configureAI } from '../services/aiService';
import { useAuth } from '../lib/auth';

const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
const DEFAULT_GROQ_KEY   = import.meta.env.VITE_GROQ_KEY   || '';

interface AppState {
  mode: AppMode;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  messages: Record<string, Message[]>;
  analysisResults: Record<string, AnalysisResult>;
  processingState: ProcessingState;
  loading: boolean;
  rightPanelOpen: boolean;
  settingsOpen: boolean;
  darkMode: boolean;
  geminiKey: string;
  groqKey: string;
  userGeminiKey: string;
  userGroqKey: string;
}

type AppAction =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_WORKSPACES'; payload: Workspace[] }
  | { type: 'ADD_WORKSPACE'; payload: Workspace }
  | { type: 'UPDATE_WORKSPACE'; payload: Workspace }
  | { type: 'DELETE_WORKSPACE'; payload: string }
  | { type: 'SET_ACTIVE_WORKSPACE'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { workspaceId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { workspaceId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { workspaceId: string; messageId: string; message: Message } }
  | { type: 'SET_ANALYSIS_RESULT'; payload: { workspaceId: string; result: AnalysisResult } }
  | { type: 'SET_PROCESSING'; payload: ProcessingState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_RIGHT_PANEL' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_USER_KEYS'; payload: { geminiKey: string; groqKey: string } };

const DEMO_WORKSPACE: Workspace = {
  id: DEMO_WORKSPACE_ID,
  name: DEMO_WORKSPACE_NAME,
  mode: 'analysis',
  is_demo: true,
  dataset_name: 'UCI Online Retail II',
  dataset_rows: 117379,
  last_analysis_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_WORKSPACES': return { ...state, workspaces: action.payload };
    case 'ADD_WORKSPACE': return { ...state, workspaces: [action.payload, ...state.workspaces] };
    case 'UPDATE_WORKSPACE': return { ...state, workspaces: state.workspaces.map(w => w.id === action.payload.id ? action.payload : w) };
    case 'DELETE_WORKSPACE': return { ...state, workspaces: state.workspaces.filter(w => w.id !== action.payload), activeWorkspaceId: state.activeWorkspaceId === action.payload ? null : state.activeWorkspaceId };
    case 'SET_ACTIVE_WORKSPACE': return { ...state, activeWorkspaceId: action.payload };
    case 'SET_MESSAGES': return { ...state, messages: { ...state.messages, [action.payload.workspaceId]: action.payload.messages } };
    case 'ADD_MESSAGE': return { ...state, messages: { ...state.messages, [action.payload.workspaceId]: [...(state.messages[action.payload.workspaceId] || []), action.payload.message] } };
    case 'UPDATE_MESSAGE': return { ...state, messages: { ...state.messages, [action.payload.workspaceId]: (state.messages[action.payload.workspaceId] || []).map(m => m.id === action.payload.messageId ? action.payload.message : m) } };
    case 'SET_ANALYSIS_RESULT': return { ...state, analysisResults: { ...state.analysisResults, [action.payload.workspaceId]: action.payload.result } };
    case 'SET_PROCESSING': return { ...state, processingState: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'TOGGLE_RIGHT_PANEL': return { ...state, rightPanelOpen: !state.rightPanelOpen };
    case 'TOGGLE_SETTINGS': return { ...state, settingsOpen: !state.settingsOpen };
    case 'TOGGLE_DARK_MODE': return { ...state, darkMode: !state.darkMode };
    case 'SET_USER_KEYS': {
      const gemini = action.payload.geminiKey || DEFAULT_GEMINI_KEY;
      const groq   = action.payload.groqKey   || DEFAULT_GROQ_KEY;
      return { ...state, userGeminiKey: action.payload.geminiKey, userGroqKey: action.payload.groqKey, geminiKey: gemini, groqKey: groq };
    }
    default: return state;
  }
}

const initialState: AppState = {
  mode: 'assistant',
  workspaces: [],
  activeWorkspaceId: null,
  messages: {},
  analysisResults: { [DEMO_WORKSPACE_ID]: DEMO_ANALYSIS_RESULT },
  processingState: { stage: 'idle', progress: 0, message: '' },
  loading: true,
  rightPanelOpen: true,
  settingsOpen: false,
  darkMode: true,
  geminiKey: DEFAULT_GEMINI_KEY,
  groqKey:   DEFAULT_GROQ_KEY,
  userGeminiKey: '',
  userGroqKey:   '',
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activeWorkspace: Workspace | null;
  activeMessages: Message[];
  activeAnalysis: AnalysisResult | null;
  createWorkspace: (name: string, mode: AppMode) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  loadMessages: (workspaceId: string) => Promise<void>;
  loadAnalysis: (workspaceId: string) => Promise<void>;
  sendMessage: (workspaceId: string, content: string, role?: 'user' | 'assistant') => Promise<Message>;
  setActiveWorkspace: (id: string) => void;
  setAnalysisResult: (workspaceId: string, result: AnalysisResult) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const activeWorkspace = state.workspaces.find(w => w.id === state.activeWorkspaceId) || null;
  const activeMessages  = state.activeWorkspaceId ? (state.messages[state.activeWorkspaceId] || []) : [];
  const activeAnalysis  = state.activeWorkspaceId ? (state.analysisResults[state.activeWorkspaceId] || null) : null;

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  // Configure AI with default keys on mount
  useEffect(() => {
    configureAI({ geminiKey: DEFAULT_GEMINI_KEY || undefined, groqKey: DEFAULT_GROQ_KEY || undefined });
  }, []);

  // Load workspaces when userId is available
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const { data } = await supabase
          .from('workspaces')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        dispatch({ type: 'SET_WORKSPACES', payload: [DEMO_WORKSPACE, ...(data || [])] });
      } catch {
        dispatch({ type: 'SET_WORKSPACES', payload: [DEMO_WORKSPACE] });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    load();
  }, [userId]);

  const createWorkspace = useCallback(async (name: string, mode: AppMode): Promise<Workspace> => {
    if (!userId) throw new Error('User not initialized');
    const ws = { name, mode, is_demo: false, dataset_name: null, dataset_rows: null, last_analysis_at: null, user_id: userId };
    try {
      const { data, error } = await supabase.from('workspaces').insert(ws).select().single();
      if (error) throw error;
      dispatch({ type: 'ADD_WORKSPACE', payload: data });
      return data;
    } catch {
      const fallback: Workspace = { ...ws, id: `local-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      dispatch({ type: 'ADD_WORKSPACE', payload: fallback });
      return fallback;
    }
  }, [userId]);

  const deleteWorkspace = useCallback(async (id: string) => {
    if (id === DEMO_WORKSPACE_ID) return;
    dispatch({ type: 'DELETE_WORKSPACE', payload: id });
    try { await supabase.from('workspaces').delete().eq('id', id); } catch { /* */ }
  }, []);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    if (id === DEMO_WORKSPACE_ID) return;
    const ws = state.workspaces.find(w => w.id === id);
    if (!ws) return;
    const updated = { ...ws, name, updated_at: new Date().toISOString() };
    dispatch({ type: 'UPDATE_WORKSPACE', payload: updated });
    try { await supabase.from('workspaces').update({ name }).eq('id', id); } catch { /* */ }
  }, [state.workspaces]);

  const loadMessages = useCallback(async (workspaceId: string) => {
    if (state.messages[workspaceId]) return;
    if (workspaceId === DEMO_WORKSPACE_ID) {
      dispatch({ type: 'SET_MESSAGES', payload: { workspaceId, messages: [] } });
      return;
    }
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      dispatch({ type: 'SET_MESSAGES', payload: { workspaceId, messages: data || [] } });
    } catch {
      dispatch({ type: 'SET_MESSAGES', payload: { workspaceId, messages: [] } });
    }
  }, [state.messages, userId]);

  const loadAnalysis = useCallback(async (workspaceId: string) => {
    if (workspaceId === DEMO_WORKSPACE_ID) return;
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const result: AnalysisResult = {
          id: data.id,
          workspace_id: data.workspace_id,
          version: data.version,
          health_score: data.health_score,
          key_findings: data.key_findings,
          metrics: data.metrics,
          forecasts: data.forecasts,
          anomalies: data.anomalies,
          audit_trail: data.audit_trail,
          report_summary: data.report_summary || '',
          raw_stats: data.raw_stats,
          created_at: data.created_at,
        };
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { workspaceId, result } });
      }
    } catch {
      // No analysis found
    }
  }, [userId]);

  const sendMessage = useCallback(async (workspaceId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<Message> => {
    if (!userId) throw new Error('User not initialized');
    const msg = { workspace_id: workspaceId, role, content, metadata: {}, user_id: userId };
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = { ...msg, id: optimisticId, created_at: new Date().toISOString() };
    dispatch({ type: 'ADD_MESSAGE', payload: { workspaceId, message: optimistic } });
    try {
      const { data } = await supabase.from('messages').insert(msg).select().single();
      if (data) {
        dispatch({ type: 'UPDATE_MESSAGE', payload: { workspaceId, messageId: optimisticId, message: data } });
        return data;
      }
    } catch { /* */ }
    return optimistic;
  }, [userId]);

  const setActiveWorkspace = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: id });
  }, []);

  const setAnalysisResult = useCallback(async (workspaceId: string, result: AnalysisResult) => {
    if (!userId) throw new Error('User not initialized');
    dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { workspaceId, result } });

    const ws = state.workspaces.find(w => w.id === workspaceId);
    if (ws) {
      const updated = {
        ...ws,
        last_analysis_at: new Date().toISOString(),
        dataset_name: result.audit_trail.dataset_name,
        dataset_rows: result.raw_stats.total_transactions,
        updated_at: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_WORKSPACE', payload: updated });

      if (workspaceId !== DEMO_WORKSPACE_ID) {
        try {
          await supabase.from('workspaces').update({
            last_analysis_at: updated.last_analysis_at,
            dataset_name: updated.dataset_name,
            dataset_rows: updated.dataset_rows,
          }).eq('id', workspaceId);

          await supabase.from('analysis_results').insert({
            workspace_id: workspaceId,
            user_id: userId,
            version: result.version,
            health_score: result.health_score,
            key_findings: result.key_findings,
            metrics: result.metrics,
            forecasts: result.forecasts,
            anomalies: result.anomalies,
            audit_trail: result.audit_trail,
            report_summary: result.report_summary,
            raw_stats: result.raw_stats,
          });
        } catch { /* */ }
      }
    }
  }, [state.workspaces, userId]);

  return (
    <AppContext.Provider value={{
      state, dispatch, activeWorkspace, activeMessages, activeAnalysis,
      createWorkspace, deleteWorkspace, renameWorkspace, loadMessages, loadAnalysis,
      sendMessage, setActiveWorkspace, setAnalysisResult,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
