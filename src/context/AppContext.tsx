import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
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
  initialized: boolean;
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
  | { type: 'SET_USER_KEYS'; payload: { geminiKey: string; groqKey: string } }
  | { type: 'SET_INITIALIZED'; payload: boolean };

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

function getInitialDarkMode(): boolean {
  const stored = localStorage.getItem('finsight_dark_mode');
  return stored ? stored === 'true' : true;
}

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
    case 'TOGGLE_DARK_MODE': {
      localStorage.setItem('finsight_dark_mode', (!state.darkMode).toString());
      return { ...state, darkMode: !state.darkMode };
    }
    case 'SET_USER_KEYS': {
      const gemini = action.payload.geminiKey || DEFAULT_GEMINI_KEY;
      const groq   = action.payload.groqKey   || DEFAULT_GROQ_KEY;
      return { ...state, userGeminiKey: action.payload.geminiKey, userGroqKey: action.payload.groqKey, geminiKey: gemini, groqKey: groq };
    }
    case 'SET_INITIALIZED': return { ...state, initialized: action.payload };
    default: return state;
  }
}

const initialState: AppState = {
  mode: 'assistant',
  workspaces: [],
  activeWorkspaceId: null,
  messages: { [DEMO_WORKSPACE_ID]: [] },
  analysisResults: { [DEMO_WORKSPACE_ID]: DEMO_ANALYSIS_RESULT },
  processingState: { stage: 'idle', progress: 0, message: '' },
  loading: true,
  rightPanelOpen: true,
  settingsOpen: false,
  darkMode: getInitialDarkMode(),
  geminiKey: DEFAULT_GEMINI_KEY,
  groqKey:   DEFAULT_GROQ_KEY,
  userGeminiKey: '',
  userGroqKey:   '',
  initialized: false,
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
  loadMessages: (workspaceId: string, force?: boolean) => Promise<void>;
  loadAnalysis: (workspaceId: string, force?: boolean) => Promise<void>;
  sendMessage: (workspaceId: string, content: string, role?: 'user' | 'assistant') => Promise<Message>;
  setActiveWorkspace: (id: string) => void;
  setAnalysisResult: (workspaceId: string, result: AnalysisResult) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userId, lastWorkspaceId, setLastWorkspaceId } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const loadedWorkspacesRef = useRef<Set<string>>(new Set());

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
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const allWorkspaces = [DEMO_WORKSPACE, ...(data || [])];
        dispatch({ type: 'SET_WORKSPACES', payload: allWorkspaces });

        // Restore last active workspace
        if (lastWorkspaceId && allWorkspaces.some(w => w.id === lastWorkspaceId)) {
          dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: lastWorkspaceId });
          const ws = allWorkspaces.find(w => w.id === lastWorkspaceId);
          if (ws) dispatch({ type: 'SET_MODE', payload: ws.mode as AppMode });
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
        dispatch({ type: 'SET_WORKSPACES', payload: [DEMO_WORKSPACE] });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    };
    load();
  }, [userId]);

  // Load messages and analysis when active workspace changes
  useEffect(() => {
    if (state.activeWorkspaceId && state.initialized) {
      loadMessages(state.activeWorkspaceId);
      loadAnalysis(state.activeWorkspaceId);
      setLastWorkspaceId(state.activeWorkspaceId);
    }
  }, [state.activeWorkspaceId, state.initialized]);

  const createWorkspace = useCallback(async (name: string, mode: AppMode): Promise<Workspace> => {
    if (!userId) throw new Error('User not initialized');
    const ws = { name, mode, is_demo: false, dataset_name: null, dataset_rows: null, last_analysis_at: null, user_id: userId };
    try {
      const { data, error } = await supabase.from('workspaces').insert(ws).select().single();
      if (error) throw error;
      dispatch({ type: 'ADD_WORKSPACE', payload: data });
      return data;
    } catch (err) {
      console.error('Failed to create workspace:', err);
      const fallback: Workspace = { ...ws, id: `local-${crypto.randomUUID()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      dispatch({ type: 'ADD_WORKSPACE', payload: fallback });
      return fallback;
    }
  }, [userId]);

  const deleteWorkspace = useCallback(async (id: string) => {
    if (id === DEMO_WORKSPACE_ID) return;
    dispatch({ type: 'DELETE_WORKSPACE', payload: id });
    if (state.activeWorkspaceId === id) {
      setLastWorkspaceId(null);
    }
    try {
      await supabase.from('workspaces').delete().eq('id', id);
      await supabase.from('messages').delete().eq('workspace_id', id);
      await supabase.from('analysis_results').delete().eq('workspace_id', id);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  }, [state.activeWorkspaceId, setLastWorkspaceId]);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    if (id === DEMO_WORKSPACE_ID) return;
    const ws = state.workspaces.find(w => w.id === id);
    if (!ws) return;
    const updated = { ...ws, name, updated_at: new Date().toISOString() };
    dispatch({ type: 'UPDATE_WORKSPACE', payload: updated });
    try {
      await supabase.from('workspaces').update({ name }).eq('id', id);
    } catch (err) {
      console.error('Failed to rename workspace:', err);
    }
  }, [state.workspaces]);

  const loadMessages = useCallback(async (workspaceId: string, force = false) => {
    if (workspaceId === DEMO_WORKSPACE_ID) return;
    if (!force && loadedWorkspacesRef.current.has(workspaceId)) return;
    loadedWorkspacesRef.current.add(workspaceId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      dispatch({ type: 'SET_MESSAGES', payload: { workspaceId, messages: data || [] } });
    } catch (err) {
      console.error('Failed to load messages:', err);
      dispatch({ type: 'SET_MESSAGES', payload: { workspaceId, messages: [] } });
    }
  }, []);

  const loadAnalysis = useCallback(async (workspaceId: string, force = false) => {
    if (workspaceId === DEMO_WORKSPACE_ID) return;
    if (!force && state.analysisResults[workspaceId]) return;

    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
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
    } catch (err) {
      console.error('Failed to load analysis:', err);
    }
  }, [state.analysisResults]);

  const sendMessage = useCallback(async (workspaceId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<Message> => {
    if (!userId) throw new Error('User not initialized');
    const msg = { workspace_id: workspaceId, role, content, metadata: {}, user_id: userId };
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = { ...msg, id: optimisticId, created_at: new Date().toISOString() };
    dispatch({ type: 'ADD_MESSAGE', payload: { workspaceId, message: optimistic } });

    try {
      const { data, error } = await supabase.from('messages').insert(msg).select().single();
      if (error) throw error;
      if (data) {
        dispatch({ type: 'UPDATE_MESSAGE', payload: { workspaceId, messageId: optimisticId, message: data } });
        return data;
      }
    } catch (err) {
      console.error('Failed to save message:', err);
    }
    return optimistic;
  }, [userId]);

  const setActiveWorkspace = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: id });
    const ws = state.workspaces.find(w => w.id === id);
    if (ws) dispatch({ type: 'SET_MODE', payload: ws.mode as AppMode });
  }, [state.workspaces]);

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
        } catch (err) {
          console.error('Failed to save analysis:', err);
        }
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
