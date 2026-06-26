import { useState } from 'react';
import { Landing } from './pages/Landing';
import { FinApp } from './pages/FinApp';
import { AuthProvider, useAuth } from './lib/auth';
import { AppProvider } from './context/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const [appStarted, setAppStarted] = useState(false);
  const [goToDemo, setGoToDemo] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--c-text-1)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return <AuthScreen />;
  }

  // Show landing or app
  if (!appStarted) {
    return (
      <Landing
        onEnter={() => { setGoToDemo(false); setAppStarted(true); }}
        onViewDemo={() => { setGoToDemo(true); setAppStarted(true); }}
      />
    );
  }

  return (
    <AppProvider>
      <FinApp onHome={() => setAppStarted(false)} startDemo={goToDemo} />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
