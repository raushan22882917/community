import React, { useState, useEffect } from 'react';
import { supabaseSvc, MOCK_PROFILES, localDb } from './supabase';
import { Issue, Profile, UserRole } from './types';
import RoleSimulator from './components/RoleSimulator';
import SupabaseConnectionPanel from './components/SupabaseConnectionPanel';
import IssueMap from './components/IssueMap';
import ImpactDashboard from './components/ImpactDashboard';
import PredictiveInsightsPanel from './components/PredictiveInsightsPanel';
import IssueReportingModal from './components/IssueReportingModal';

// Dedicated Premium Role Dashboards
import CitizenDashboard from './components/CitizenDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import DispatcherDashboard from './components/DispatcherDashboard';
import AdminDashboard from './components/AdminDashboard';
import SupabaseAuthModal from './components/SupabaseAuthModal';

// Brand New Navigation Views
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

import { 
  Building2, 
  Map, 
  BarChart3, 
  BrainCircuit, 
  Database, 
  PlusCircle, 
  Hammer, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  HelpCircle,
  Clock,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Key
} from 'lucide-react';

export default function App() {
  // Navigation & Auth Flow State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'signup'>('home');

  // Simulator & Auth State
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [activeProfile, setActiveProfile] = useState<Profile>(MOCK_PROFILES.public);
  const [realUser, setRealUser] = useState<any>(null);
  const [isRealAuthActive, setIsRealAuthActive] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Issues & DB State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'insights' | 'database' | 'console'>('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportingOpen, setIsReportingOpen] = useState(false);

  // Loading/Operation States
  const [loading, setLoading] = useState(true);

  // Worker resolution form state
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImg, setResolutionImg] = useState('');

  // Initial Data Fetching
  const refreshIssues = async () => {
    setLoading(true);
    const data = await supabaseSvc.fetchIssues();
    setIssues(data);
    
    // Select the first issue as a starting detail pointer
    if (data.length > 0 && !selectedIssue) {
      setSelectedIssue(data[0]);
    } else if (selectedIssue) {
      const updated = data.find(i => i.id === selectedIssue.id);
      if (updated) setSelectedIssue(updated);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshIssues();
  }, []);

  // Guard activeTab based on currentRole (Roles-based dashboard protection)
  useEffect(() => {
    const allowedTabs: Record<UserRole, string[]> = {
      public: ['map', 'dashboard', 'console'],
      worker: ['map', 'console'],
      department: ['map', 'dashboard', 'console'],
      admin: ['map', 'dashboard', 'insights', 'database', 'console']
    };
    if (!allowedTabs[currentRole].includes(activeTab)) {
      setActiveTab('console');
    }
  }, [currentRole, activeTab]);

  // Listen to Supabase Auth state changes dynamically
  useEffect(() => {
    let subscription: any = null;

    const initAuth = async () => {
      // 1. Fetch config from server secrets if available
      await supabaseSvc.fetchConfigFromServer();

      // 2. Try fetching active Supabase session
      const sessionData = await supabaseSvc.getSessionProfile();
      if (sessionData) {
        setRealUser(sessionData.user);
        if (sessionData.profile) {
          if (sessionData.profile.role !== 'public') {
            setActiveProfile(sessionData.profile);
            setCurrentRole(sessionData.profile.role);
            setIsRealAuthActive(true);
            setIsLoggedIn(true);
            setActiveTab('console'); // auto-redirect to their specific dashboard
          } else {
            // Citizen account is not allowed to log into the dispatch dashboard
            console.warn('Citizen account restricted from admin/municipal dashboard console.');
            await supabaseSvc.signOutUser();
            setRealUser(null);
          }
        }
      }

      // 3. Set up the dynamic listener on the connected client if present
      const client = supabaseSvc.getClient();
      if (client) {
        const { data } = client.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            setRealUser(session.user);
            const profile = await supabaseSvc.fetchProfile(session.user.id);
            if (profile && profile.role !== 'public') {
              setActiveProfile(profile);
              setCurrentRole(profile.role);
              setIsRealAuthActive(true);
              setIsLoggedIn(true);
              setActiveTab('console'); // auto-redirect to their specific dashboard
            } else {
              // Sign out if public or not matched
              console.warn('Unauthorized role restricted from console portal.');
              await supabaseSvc.signOutUser();
              setRealUser(null);
              setIsRealAuthActive(false);
              setIsLoggedIn(false);
            }
          } else {
            setRealUser(null);
            setIsRealAuthActive(false);
          }
        });
        subscription = data.subscription;
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLoginSuccess = (user: any, profile: any) => {
    if (!profile || profile.role === 'public') {
      console.warn('Prevented public role console login redirect.');
      return;
    }
    setRealUser(user);
    setActiveProfile(profile);
    setCurrentRole(profile.role);
    setIsLoggedIn(true);
    setActiveTab('console');
    // If it is a simulated profile (not real uuid), save to localStorage
    if (!supabaseSvc.getConfig().isConnected || !user.id || typeof user.id === 'string' && user.id.startsWith('user-')) {
      localStorage.setItem('ch_logged_in_profile', JSON.stringify(profile));
    }
    setCurrentView('home');
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const profile = MOCK_PROFILES[role];
    setActiveProfile(profile);
    setCurrentRole(profile.role);
    setIsLoggedIn(true);
    setActiveTab('console');
    localStorage.setItem('ch_logged_in_profile', JSON.stringify(profile));
  };

  const handleSignOut = async () => {
    if (supabaseSvc.getConfig().isConnected) {
      await supabaseSvc.signOutUser();
    }
    localStorage.removeItem('ch_logged_in_profile');
    setRealUser(null);
    setIsRealAuthActive(false);
    setIsLoggedIn(false);
    setCurrentRole('public');
    setActiveProfile(MOCK_PROFILES.public);
    setCurrentView('home');
  };

  // Update simulated profile when user switches roles in header
  const handleRoleChange = (role: UserRole) => {
    setIsRealAuthActive(false);
    setCurrentRole(role);
    setActiveProfile(MOCK_PROFILES[role]);
  };

  // Upvote Problem
  const handleUpvote = async (issueId: string) => {
    const newUpvotes = await supabaseSvc.upvoteIssue(issueId);
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, upvotes: newUpvotes };
      }
      return issue;
    }));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => prev ? { ...prev, upvotes: newUpvotes } : null);
    }
  };

  // Verify Problem
  const handleVerify = async (issueId: string, status: 'verified' | 'disputed', note: string) => {
    await supabaseSvc.addVerification(issueId, activeProfile.id, activeProfile.full_name, status, note);
    
    // Give user simulated gamification points (+5)
    const updatedProfile = { ...activeProfile, points: activeProfile.points + 5 };
    setActiveProfile(updatedProfile);
    
    // Auto validate issue if enough positive verifications are posted
    if (status === 'verified') {
      await supabaseSvc.updateIssueStatus(issueId, 'validated');
    }
    
    await refreshIssues();
  };

  // Citizen reports an issue
  const handleReportIssueSubmit = async (newIssueData: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'upvotes'>) => {
    await supabaseSvc.saveIssue(newIssueData);
    
    // Award citizen points (+20)
    const updatedProfile = { ...activeProfile, points: activeProfile.points + 20 };
    setActiveProfile(updatedProfile);
    
    setIsReportingOpen(false);
    await refreshIssues();
  };

  // Department Dispatcher: Assigns Maintenance Worker
  const handleAssignWorker = async (issueId: string) => {
    const worker = MOCK_PROFILES.worker;
    await supabaseSvc.updateIssueStatus(issueId, 'in_progress', {
      assigned_worker_id: worker.id,
      assigned_worker_name: worker.full_name
    });
    await refreshIssues();
  };

  // Worker: Submits resolution logs
  const handleResolveIssueSubmit = async (e: React.FormEvent, issueId: string, customNote?: string, customImg?: string) => {
    e.preventDefault();
    const finalNote = customNote || resolutionNote;
    const finalImg = customImg || resolutionImg;
    if (!finalNote) return;

    await supabaseSvc.updateIssueStatus(issueId, 'resolved', {
      resolved_at: new Date().toISOString(),
      resolution_note: finalNote,
      resolution_image: finalImg || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
    });

    setResolutionNote('');
    setResolutionImg('');
    await refreshIssues();
  };

  // Reset Mock Local DB Flow for quick testing
  const handleResetData = () => {
    localStorage.removeItem('ch_issues');
    localStorage.removeItem('ch_verifications');
    localStorage.removeItem('ch_comments');
    refreshIssues();
  };

  if (!isLoggedIn) {
    if (currentView === 'login') {
      return <LoginPage onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
    }
    if (currentView === 'signup') {
      return <SignupPage onNavigate={setCurrentView} onSignupSuccess={handleLoginSuccess} />;
    }
    return (
      <LandingPage 
        onNavigate={setCurrentView} 
        issues={issues} 
        onQuickDemoLogin={handleQuickDemoLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Dual Column Slack + Notion Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-screen overflow-hidden">
        {/* Left Sidebar - Collapsible on Mobile, Persistent on Desktop */}
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed inset-y-0 left-0 z-45 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:static md:flex-shrink-0 md:h-auto
        `}>
          {/* Workspace Header Brand */}
          <div className="p-4 border-b border-gray-150 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-orange-600 rounded-lg flex items-center justify-center font-black text-white text-base tracking-tighter shadow-md shadow-orange-600/10">
                CH
              </div>
              <div>
                <h2 className="text-xs font-black text-gray-800 flex items-center gap-1.5 leading-none uppercase tracking-widest">
                  CivicHero Portal
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                </h2>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">
                  {supabaseSvc.getConfig().isConnected ? 'Cloud-Connected Grid' : 'Local Demo Instance'}
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-150 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sidebar Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">

            {/* Shared Workspace Pages */}
            <div className="space-y-2">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Global Portal Navigation</span>
              <div className="space-y-0.5">
                {/* hyperlocal-map - available for all roles */}
                <button
                  onClick={() => { setActiveTab('map'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                    activeTab === 'map' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                  }`}
                >
                  <Map size={14} />
                  <span>🗺️ Hyperlocal City Map</span>
                </button>

                {/* impact-dashboards - available for citizen, dispatcher, and admin */}
                {['public', 'department', 'admin'].includes(currentRole) && (
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'dashboard' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <BarChart3 size={14} />
                    <span>📊 Public Impact Metrics</span>
                  </button>
                )}

                {/* predictive-insights - available for admin only */}
                {['admin'].includes(currentRole) && (
                  <button
                    onClick={() => { setActiveTab('insights'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'insights' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <BrainCircuit size={14} />
                    <span>🤖 AI Urban Forecasts</span>
                  </button>
                )}

                {/* database-rls-setup - available for admin only */}
                {['admin'].includes(currentRole) && (
                  <button
                    onClick={() => { setActiveTab('database'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'database' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <Database size={14} />
                    <span>⚙️ Platform Settings</span>
                  </button>
                )}
              </div>
            </div>

            {/* Personal Command Center */}
            <div className="space-y-2">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Personal Portal Console</span>
              <div className="space-y-0.5">
                {currentRole === 'public' && (
                  <button
                    onClick={() => { setActiveTab('console'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'console'
                        ? 'bg-green-50 text-green-700 font-bold border-l-2 border-green-500 pl-2.5'
                        : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <span>👤 Resident Dashboard</span>
                    <span className="text-[9px] bg-green-100 px-1.5 py-0.5 rounded text-green-700 border border-green-200/50 font-mono font-bold">{activeProfile.points} pts</span>
                  </button>
                )}

                {currentRole === 'worker' && (
                  <button
                    onClick={() => { setActiveTab('console'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'console'
                        ? 'bg-orange-50 text-orange-700 font-bold border-l-2 border-orange-500 pl-2.5'
                        : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <span>🛠️ Field Work Checklist</span>
                    <span className="text-[9px] bg-orange-100 px-1.5 py-0.5 rounded text-orange-700 border border-orange-200/50 font-mono font-bold">active</span>
                  </button>
                )}

                {currentRole === 'department' && (
                  <button
                    onClick={() => { setActiveTab('console'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'console'
                        ? 'bg-orange-50 text-orange-700 font-bold border-l-2 border-orange-500 pl-2.5'
                        : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <span>📡 Central Dispatch Center</span>
                    <span className="text-[9px] bg-orange-100 px-1.5 py-0.5 rounded text-orange-700 border border-orange-200/50 font-mono font-bold font-semibold">active</span>
                  </button>
                )}

                {currentRole === 'admin' && (
                  <button
                    onClick={() => { setActiveTab('console'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      activeTab === 'console'
                        ? 'bg-red-50 text-red-700 font-bold border-l-2 border-red-500 pl-2.5'
                        : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/60'
                    }`}
                  >
                    <span>👑 Admin Command Deck</span>
                    <span className="text-[9px] bg-red-100 px-1.5 py-0.5 rounded text-red-700 border border-red-200/50 font-mono font-bold font-semibold">active</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer - Active authenticated profile details */}
          <div className="p-4 border-t border-gray-150 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentRole === 'public' ? 'bg-green-100 text-green-700' :
                  currentRole === 'worker' ? 'bg-orange-100 text-orange-700' :
                  currentRole === 'department' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {activeProfile.full_name ? activeProfile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-800 block truncate leading-none mb-0.5">
                  {activeProfile.full_name}
                </span>
                <span className="text-[10px] text-gray-400 truncate block font-medium">
                  {activeProfile.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Log Out Securely</span>
            </button>
          </div>
        </aside>

        {/* Right Workspace Main View */}
        <main className="flex-1 min-w-0 bg-gray-50 flex flex-col h-screen overflow-y-auto">
          {/* Top Breadcrumb Bar (Notion Style) */}
          <header className="bg-white border-b border-gray-200 p-3.5 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle Hamburger */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <Menu size={18} />
              </button>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="font-sans text-gray-700">🏢 CivicHero SF</span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="font-sans text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded">
                  {activeTab === 'map' && 'Hyperlocal City Map'}
                  {activeTab === 'dashboard' && 'Public Impact Metrics'}
                  {activeTab === 'insights' && 'AI Urban Forecasts'}
                  {activeTab === 'database' && 'Platform Settings'}
                  {activeTab === 'console' && (
                    currentRole === 'public' ? 'Resident Dashboard' : 
                    currentRole === 'worker' ? 'Field Work Assignment' : 
                    currentRole === 'department' ? 'Central Dispatch Center' : 
                    'Admin Command Deck'
                  )}
                </span>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 font-bold tracking-wide uppercase bg-gray-50 border border-gray-200/80 px-2.5 py-1.5 rounded-lg select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Municipal Network Connected</span>
              </div>
              {currentRole === 'public' && (
                <button
                  onClick={() => setIsReportingOpen(true)}
                  className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  <PlusCircle size={13} />
                  <span>Report Problem</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Display Pane */}
          <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="h-8 w-8 border-4 border-t-orange-600 border-gray-200 rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Fetching neighborhood database tables...</span>
              </div>
            ) : (
              <div>
                {activeTab === 'map' && (
                  <IssueMap
                    issues={issues}
                    currentRole={currentRole}
                    activeProfile={activeProfile}
                    onUpvote={handleUpvote}
                    onVerify={handleVerify}
                    onSelectIssue={setSelectedIssue}
                    selectedIssue={selectedIssue}
                  />
                )}

                {activeTab === 'dashboard' && (
                  <ImpactDashboard
                    issues={issues}
                    activeProfile={activeProfile}
                  />
                )}

                {activeTab === 'insights' && (
                  <PredictiveInsightsPanel
                    issues={issues}
                  />
                )}

                {activeTab === 'database' && (
                  <SupabaseConnectionPanel />
                )}

                {activeTab === 'console' && (
                  <div>
                    {currentRole === 'public' && (
                      <CitizenDashboard
                        issues={issues}
                        activeProfile={activeProfile}
                        onOpenReportModal={() => setIsReportingOpen(true)}
                        onSelectIssue={setSelectedIssue}
                        onTabChange={setActiveTab}
                      />
                    )}

                    {currentRole === 'worker' && (
                      <WorkerDashboard
                        issues={issues}
                        activeProfile={activeProfile}
                        selectedIssue={selectedIssue}
                        onSelectIssue={setSelectedIssue}
                        onResolveIssueSubmit={handleResolveIssueSubmit}
                      />
                    )}

                    {currentRole === 'department' && (
                      <DispatcherDashboard
                        issues={issues}
                        activeProfile={activeProfile}
                        onAssignWorker={handleAssignWorker}
                        onSelectIssue={setSelectedIssue}
                        onTabChange={setActiveTab}
                      />
                    )}

                    {currentRole === 'admin' && (
                      <AdminDashboard
                        issues={issues}
                        onRefresh={refreshIssues}
                        onResetData={handleResetData}
                        onSelectIssue={setSelectedIssue}
                        onTabChange={setActiveTab}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thin Footer */}
          <footer className="bg-white border-t border-gray-200 py-3.5 px-6 text-center text-[10px] text-gray-400 shrink-0 mt-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 CivicHero. Empowering communities through transparent civic participation.</span>
            <span className="text-[9px] bg-gray-50 border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded font-mono font-semibold tracking-wider">CITY OF SAN FRANCISCO SECURED NODE</span>
          </footer>
        </main>
      </div>

      {/* Issue reporting modal for citizens */}
      {isReportingOpen && (
        <IssueReportingModal
          onClose={() => setIsReportingOpen(false)}
          onSubmit={handleReportIssueSubmit}
          activeProfile={activeProfile}
        />
      )}

      {/* Real Supabase auth modal */}
      {isAuthModalOpen && (
        <SupabaseAuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user, profile) => {
            setRealUser(user);
            if (profile) {
              setActiveProfile(profile);
              setCurrentRole(profile.role);
              setIsRealAuthActive(true);
            }
          }}
        />
      )}
    </div>
  );
}
