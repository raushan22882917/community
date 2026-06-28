import React, { useState } from 'react';
import { supabaseSvc } from '../supabase';
import { UserRole, Profile } from '../types';
import { Mail, Lock, User, Briefcase, Shield, ArrowLeft, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface SignupPageProps {
  onNavigate: (view: 'home' | 'login' | 'signup') => void;
  onSignupSuccess: (user: any, profile: any) => void;
}

export default function SignupPage({ onNavigate, onSignupSuccess }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [department, setDepartment] = useState('Roads');
  
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
      if (!fullName.trim()) {
        throw new Error('Please enter your full name.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      if (role === 'public') {
        throw new Error('Access Denied: Registrations of public citizens to the dispatch dashboard are disabled. Please participate directly via the Home page.');
      }

      if (isConnected) {
        // Real Supabase Signup Flow
        const { user, profile } = await supabaseSvc.signUp(
          email,
          password,
          fullName,
          role,
          role === 'worker' || role === 'department' ? department : undefined
        );
        setSuccess('Account registered successfully in live database! Setting up profile...');
        setTimeout(() => {
          onSignupSuccess(user, profile);
        }, 1500);
      } else {
        // Simulated Local Storage Signup Flow
        const localUsers = JSON.parse(localStorage.getItem('ch_local_users') || '[]');
        
        // Check if user already exists
        if (localUsers.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase())) {
          throw new Error('An account with this email address already exists in local sandbox.');
        }

        const simulatedUserId = `user-${Date.now()}`;
        const newProfile: Profile = {
          id: simulatedUserId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
          points: 10,
          created_at: new Date().toISOString()
        };

        if (role === 'worker' || role === 'department') {
          newProfile.department = department;
        }

        const newLocalUser = {
          email: email.trim().toLowerCase(),
          password,
          profile: newProfile
        };

        localUsers.push(newLocalUser);
        localStorage.setItem('ch_local_users', JSON.stringify(localUsers));

        setSuccess(`Local account successfully created! Entering portal as ${fullName}...`);
        setTimeout(() => {
          onSignupSuccess({ id: simulatedUserId, email }, newProfile);
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please review your inputs.');
    } finally {
      setLoading(false);
    }
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
        
        {/* Header decoration */}
        <div className="p-8 pb-4 text-center">
          <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-lg border border-orange-100">
            CH
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none uppercase">
            Create New Account
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {isConnected 
              ? 'Register a real profile tied to your cloud database' 
              : 'Sign up for a secure simulated local storage profile'}
          </p>
        </div>

        {/* Signup form */}
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
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

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
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Functional Staff Role</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3.5 top-4 text-gray-400 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer font-medium"
              >
                <option value="worker">Maintenance Crew (Marcus Style)</option>
                <option value="department">Roads Dispatcher (Director Style)</option>
                <option value="admin">System Administrator (Sterling Style)</option>
              </select>
            </div>
            <span className="text-[9px] text-gray-400 block font-medium leading-relaxed">
              This dashboard is restricted to Admin &amp; Municipal roles. Public citizens participate directly via the Home page.
            </span>
          </div>

          {(role === 'worker' || role === 'department') && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Responsible Department</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3.5 top-4 text-gray-400 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer font-medium"
                >
                  <option value="Roads">Roads Department</option>
                  <option value="Water & Sewage">Water &amp; Sewage Department</option>
                  <option value="Electricity">Electricity Department</option>
                  <option value="Sanitation">Sanitation Department</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <span>Create Account &amp; Log In</span>
            )}
          </button>
        </form>

        {/* Existing account switcher */}
        <div className="p-5 bg-gray-50 border-t border-gray-150 text-center text-xs text-gray-500">
          Already registered?{' '}
          <button 
            onClick={() => onNavigate('login')} 
            className="text-orange-600 hover:text-orange-700 font-bold underline bg-transparent border-none cursor-pointer"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}
