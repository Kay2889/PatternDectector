import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader, Mail, Lock, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase, ADMIN_EMAIL } from '../../lib/supabase';

const ADMIN_PASSWORD = '0244667232andrews';

export function AdminLoginPage() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError('Invalid admin credentials. Only authorized administrators can access this portal.');
      setLoading(false);
      return;
    }

    // First try to sign in
    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      // If user doesn't exist or credentials wrong, check if this is the admin creating account
      if (
        email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        password === ADMIN_PASSWORD
      ) {
        // Try to create the admin account
        const { error: signUpError } = await signUp(email, password, { name: 'Admin' });

        if (signUpError) {
          setError('Failed to create admin account. Please try again.');
          setLoading(false);
          return;
        }

        // Now sign in
        const { error: secondSignInError } = await signIn(email, password);
        if (secondSignInError) {
          setError('Account created but login failed. Please try again.');
          setLoading(false);
          return;
        }

        // Ensure admin role in profiles
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              full_name: 'Admin',
              role: 'admin',
            },
            { onConflict: 'id' }
          );
        }

        navigate('/admin', { replace: true });
      } else {
        setError('Invalid credentials. Please check your email and password.');
        setLoading(false);
      }
    } else {
      // Successful login - ensure admin role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            role: 'admin',
          },
          { onConflict: 'id' }
        );
      }
      navigate('/admin', { replace: true });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-slate-400">DarkScan AI Administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showEmail ? 'text' : 'password'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter admin email"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showEmail ? 'Hide email' : 'Show email'}
                >
                  {showEmail ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Click the eye icon to view what you typed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Click the eye icon to view what you typed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-sm">
              This area is restricted to authorized administrators only.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-4">
          <a href="/" className="text-slate-400 hover:text-white transition-colors">
            ← Back to DarkScan AI
          </a>
        </p>
      </div>
    </div>
  );
}
