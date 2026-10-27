import React, { useState } from 'react';
import { X, User, Lock, Mail, Building, BookOpen, Shield, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onAuthSuccess: (user: UserType) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [researchInterests, setResearchInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await apiClient.login(email, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await apiClient.register({
          email,
          password,
          fullName,
          institution,
          researchInterests
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.login(demoEmail, demoPass);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0A1020] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {currentUser ? 'Scholar Profile' : mode === 'login' ? 'Sign In to ResearchIntel AI' : 'Create Scholar Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Persistent SQLite Profile' : 'PBKDF2-SHA512 Secure Session'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in view */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-semibold text-white">{currentUser.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="font-mono text-cyan-400">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role</span>
                  <span className="capitalize font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]">
                    {currentUser.role}
                  </span>
                </div>
                {currentUser.institution && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Institution</span>
                    <span className="text-slate-300 text-right">{currentUser.institution}</span>
                  </div>
                )}
                {currentUser.research_interests && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Research Interests</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed block">
                      {currentUser.research_interests}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Auth form */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'login' ? 'bg-cyan-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'register' ? 'bg-cyan-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Dr. Jane Doe / Kaviya R."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-slate-300 mb-1 block">Academic Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="scholar@university.edu"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1 block">Institution / Department (Optional)</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={institution}
                          onChange={e => setInstitution(e.target.value)}
                          placeholder="Department of AI & Data Science"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1 block">Research Interests (Optional)</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={researchInterests}
                          onChange={e => setResearchInterests(e.target.value)}
                          placeholder="Natural Language Processing, Computer Vision"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
                </button>
              </form>

              {/* 1-Click Demo Accounts */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block text-center">
                  Quick Demo Accounts (1-Click Fill)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin('scholar@university.edu', 'ScholarPassword123!')}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-slate-200 block truncate">Research Scholar</span>
                    <span className="text-[10px] font-mono text-cyan-400 block truncate">scholar@univ.edu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handle1ClickLogin('admin@researchintel.ai', 'AdminPassword123!')}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 text-left transition-all cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-slate-200 block truncate">System Admin</span>
                    <span className="text-[10px] font-mono text-violet-400 block truncate">admin@researchintel.ai</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
