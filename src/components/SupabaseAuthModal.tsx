import React, { useState } from 'react';
import { supabaseSvc } from '../supabase';
import { UserRole } from '../types';
import { Mail, Lock, User, Briefcase, Shield, X, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface SupabaseAuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: any, profile: any) => void;
}

export default function SupabaseAuthModal({ onClose, onAuthSuccess }: SupabaseAuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('public');
  const [department, setDepartment] = useState('Roads');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        const { user, profile } = await supabaseSvc.signUp(
          email,
          password,
          fullName,
          role,
          role === 'worker' || role === 'department' ? department : undefined
        );
        setSuccess('Account registered successfully! Welcome to the workspace.');
        setTimeout(() => {
          onAuthSuccess(user, profile);
          onClose();
        }, 1500);
      } else {
        const { user, profile } = await supabaseSvc.signIn(email, password);
        setSuccess('Welcome back! Loading your profile...');
        setTimeout(() => {
          onAuthSuccess(user, profile);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header decoration */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-green-500" />
        
        {/* Title Block */}
        <div className="p-6 pb-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-orange-600" size={16} />
              <span>{isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isSignUp ? 'Register a real profile tied to your Supabase Auth' : 'Access your authorized department dashboards'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-start gap-2 animate-shake">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-9 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@community.org"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-9 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-9 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Simulated Authority Role</label>
                <div className="relative">
                  <Shield size={14} className="absolute left-3 top-3.5 text-gray-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-9 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="public">Public Citizen Hero ( Elena )</option>
                    <option value="worker">Maintenance Worker ( Marcus )</option>
                    <option value="department">Roads Dispatcher ( Chief )</option>
                    <option value="admin">System Admin ( Supervisor )</option>
                  </select>
                </div>
                <span className="text-[9px] text-gray-400 block">
                  Select your role. Our automatic Row Level Security (RLS) policies will enforce this role.
                </span>
              </div>

              {(role === 'worker' || role === 'department') && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Assigned Department</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-3.5 text-gray-400" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-9 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                    >
                      <option value="Roads">Roads Department</option>
                      <option value="Water & Sewage">Water &amp; Sewage</option>
                      <option value="Electricity">Electricity Department</option>
                      <option value="Sanitation">Sanitation Department</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs py-2.5 rounded-lg cursor-pointer transition-colors shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <span>{isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}</span>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 text-center text-[11px] text-gray-500">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(false)} 
                className="text-orange-600 hover:text-orange-700 font-semibold underline bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(true)} 
                className="text-orange-600 hover:text-orange-700 font-semibold underline bg-transparent border-none cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
