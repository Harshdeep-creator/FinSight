import { useState } from 'react';
import { TrendingUp, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--c-bg)' }}>
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'var(--c-text-1)' }}>
            <TrendingUp size={24} style={{ color: 'var(--c-bg)' }} />
          </div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>FinSight</h1>
          <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>AI Financial Intelligence Platform</p>
        </div>

        {/* Form */}
        <div className="rounded-xl p-6" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <h2 className="text-lg font-medium text-center mb-4" style={{ color: 'var(--c-text-1)' }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--c-text-3)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-4)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--c-text-3)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-4)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-base pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md p-3 text-xs" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--c-border)' }}>
            <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="font-semibold underline"
                style={{ color: 'var(--c-text-1)' }}
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-2xs text-center mt-4" style={{ color: 'var(--c-text-5)' }}>
          Your data is private and only accessible to you.
        </p>
      </div>
    </div>
  );
}
