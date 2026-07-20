import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { Shield, AlertTriangle, Scan, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type AuthView = 'login' | 'register' | 'forgot-password';

export function AuthPage() {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen">
          {/* Left column - Hero */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <Link to="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  DarkScan AI
                </h1>
              </Link>

              <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                Protect yourself from manipulative design patterns
              </h2>

              <p className="text-lg text-slate-600 mb-8">
                Our AI-powered platform analyzes websites and screenshots to identify deceptive UI patterns
                that trick users into making unintended decisions.
              </p>

              <div className="grid gap-4">
                {[
                  {
                    icon: Scan,
                    title: 'Website Scanner',
                    description: 'Analyze any URL for dark patterns in real-time',
                  },
                  {
                    icon: AlertTriangle,
                    title: 'Screenshot Scanner',
                    description: 'Upload screenshots and detect manipulative elements',
                  },
                  {
                    icon: Lock,
                    title: 'Privacy First',
                    description: 'Your data stays secure and private',
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Auth forms */}
          <div className="flex items-center justify-center lg:justify-end py-8 lg:py-0">
            <div className="w-full max-w-md">
              {/* Back to home */}
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>

              {view === 'login' && (
                <Login
                  onSwitchToRegister={() => setView('register')}
                  onSwitchToForgotPassword={() => setView('forgot-password')}
                />
              )}
              {view === 'register' && <Register onSwitchToLogin={() => setView('login')} />}
              {view === 'forgot-password' && <ForgotPassword onSwitchToLogin={() => setView('login')} />}
            </div>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8 absolute top-4 left-4 right-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                DarkScan AI
              </h1>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
