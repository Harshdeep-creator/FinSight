import { useState } from 'react';
import { Landing } from './pages/Landing';
import { FinApp } from './pages/FinApp';

export default function App() {
  const [appStarted, setAppStarted] = useState(false);
  const [goToDemo, setGoToDemo] = useState(false);

  if (!appStarted) {
    return (
      <Landing
        onEnter={() => { setGoToDemo(false); setAppStarted(true); }}
        onViewDemo={() => { setGoToDemo(true); setAppStarted(true); }}
      />
    );
  }

  return <FinApp onHome={() => setAppStarted(false)} startDemo={goToDemo} />;
}
