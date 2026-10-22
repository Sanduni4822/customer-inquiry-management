import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(userEmail, 'password123');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ninja-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-900 flex items-center justify-center text-amber-100 shadow-md">
          <Coffee size={32} />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          Coffee Ninja (Pvt) Ltd
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Staff Portal & Customer Inquiry Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100">
          {error && (
            <div className="mb-4">
              <ErrorAlert message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Staff Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. sarah@coffeeninja.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in to Workspace'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick seeded account switcher */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
              One-Click Seeded Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah@coffeeninja.com')}
                disabled={isSubmitting}
                className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-amber-700/60 hover:bg-amber-50/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                    SJ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-amber-900">
                      Sarah Jenkins
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Support Agent (sarah@coffeeninja.com)
                    </p>
                  </div>
                </div>
                <UserCheck size={14} className="text-gray-400 group-hover:text-amber-800" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('david@coffeeninja.com')}
                disabled={isSubmitting}
                className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-amber-700/60 hover:bg-amber-50/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    DC
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-amber-900">
                      David Chen
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Sales Agent (david@coffeeninja.com)
                    </p>
                  </div>
                </div>
                <UserCheck size={14} className="text-gray-400 group-hover:text-amber-800" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('elena@coffeeninja.com')}
                disabled={isSubmitting}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/30 hover:border-purple-500 hover:bg-purple-50/70 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                    ER
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-purple-900 flex items-center gap-1.5">
                      Elena Rostova
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-semibold">
                        Manager
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Operations Mgr (elena@coffeeninja.com)
                    </p>
                  </div>
                </div>
                <ShieldCheck size={14} className="text-purple-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
