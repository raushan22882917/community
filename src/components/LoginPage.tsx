import React, { useState } from 'react';
import { supabaseSvc, MOCK_PROFILES } from '../supabase';
import { Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, Sparkles, User, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: 'home' | 'login' | 'signup') => void;
  onLoginSuccess: (user: any, profile: any) => void;
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isConnected = supabaseSvc.getConfig().isConnected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isConnected) {
        // Real Supabase Auth Flow
        const { user, profile } = await supabaseSvc.signIn(email, password);
        if (profile && profile.role === 'public') {
          await supabaseSvc.signOutUser();
          throw new Error('Access Denied: This dispatch dashboard is restricted to Admin & Municipal Staff. Residents can participate directly on the Home page.');
        }
        setSuccess('Welcome back! Synchronized credentials authenticated.');
        setTimeout(() => {
          onLoginSuccess(user, profile);
        }, 1200);
      } else {
        // Simulated Local Auth Flow
        // Check if it matches any of our predefined sandbox emails for easy evaluation
        const trimmedEmail = email.trim().toLowerCase();
        let matchedRole: any = null;

        if (trimmedEmail === 'citizen.hero@community.org') matchedRole = 'public';
        else if (trimmedEmail === 'marcus.dispatch@city.gov') matchedRole = 'worker';
        else if (trimmedEmail === 'sarah.planning@city.gov') matchedRole = 'department';
        else if (trimmedEmail === 'city.admin@communityhero.gov') matchedRole = 'admin';

        if (matchedRole) {
          if (matchedRole === 'public') {
            throw new Error('Access Denied: This dispatch dashboard is restricted to Admin & Municipal Staff. Residents can participate directly on the Home page.');
          }
          setSuccess(`Logged in successfully to Sandbox as ${MOCK_PROFILES[matchedRole].full_name}!`);
          setTimeout(() => {
            onLoginSuccess({ id: MOCK_PROFILES[matchedRole].id, email: trimmedEmail }, MOCK_PROFILES[matchedRole]);
          }, 1000);
        } else {
          // Check localStorage registered accounts
          const localUsers = JSON.parse(localStorage.getItem('ch_local_users') || '[]');
          const userMatch = localUsers.find((u: any) => u.email.toLowerCase() === trimmedEmail && u.password === password);
          
          if (userMatch) {
            if (userMatch.profile.role === 'public') {
              throw new Error('Access Denied: This dispatch dashboard is restricted to Admin & Municipal Staff. Residents can participate directly on the Home page.');
            }
            setSuccess(`Welcome back, ${userMatch.profile.full_name}!`);
            setTimeout(() => {
              onLoginSuccess({ id: userMatch.profile.id, email: userMatch.email }, userMatch.profile);
            }, 1000);
          } else {
            throw new Error('Invalid email or password. To test easily, use one of the "Instant Demo Logins" below.');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Preset demo accounts login helper
  const handleQuickLogin = (role: 'worker' | 'department' | 'admin') => {
    const profile = MOCK_PROFILES[role];
    setLoading(true);
    setError(null);
    setSuccess(`Entering portal as ${profile.full_name} (${profile.role})`);
    
    setTimeout(() => {
      onLoginSuccess(
        { id: profile.id, email: profile.email },
        profile
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans text-gray-900">
      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={13} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-600" />
        
        {/* Title block */}
        <div className="p-8 pb-4 text-center">
          <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-lg border border-orange-100">
            CH
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none uppercase">
            Sign In to Portal
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {isConnected 
              ? 'Enter credentials tied to your synced Supabase project' 
              : 'Enter your credentials or select an instant demo profile below'}
          </p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start gap-2.5">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen.hero@community.org"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Password</label>
              <a href="#" className="text-[10px] font-bold text-orange-600 hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <span>Sign In to Your Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
