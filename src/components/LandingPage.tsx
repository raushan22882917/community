import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Map, 
  BarChart3, 
  BrainCircuit, 
  Database, 
  ShieldCheck, 
  PlusCircle, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Server,
  Lock,
  MessageSquare,
  Wrench,
  Activity,
  ThumbsUp,
  Search,
  Filter,
  Clock,
  Send,
  Plus,
  MapPin,
  Flame,
  UserCheck
} from 'lucide-react';
import { supabaseSvc } from '../supabase';
import { Issue, Profile, Comment, Verification, IssueStatus } from '../types';

interface LandingPageProps {
  onNavigate: (view: 'home' | 'login' | 'signup') => void;
  issues: Issue[];
  onQuickDemoLogin: (role: 'public' | 'worker' | 'department' | 'admin') => void;
}

export default function LandingPage({ onNavigate, issues, onQuickDemoLogin }: LandingPageProps) {
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbUrl, setDbUrl] = useState(supabaseSvc.getConfig().url || '');
  const [dbKey, setDbKey] = useState(supabaseSvc.getConfig().anonKey || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Home dynamic states
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issues' | 'leaderboard' | 'activity'>('issues');

  // Issue Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Expanded Issue for detailed viewing & commenting/verifying
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [verificationsMap, setVerificationsMap] = useState<Record<string, Verification[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [newVerifStatus, setNewVerifStatus] = useState<'verified' | 'disputed'>('verified');
  const [newVerifComment, setNewVerifComment] = useState('');

  // Submit Issue states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportCategory, setReportCategory] = useState('Pothole');
  const [reportGuestName, setReportGuestName] = useState('');
  const [reportImg, setReportImg] = useState('');

  const isConnected = supabaseSvc.getConfig().isConnected;

  // Initial stats derived from live localIssues
  const totalIssues = localIssues.length;
  const resolvedIssues = localIssues.filter(i => i.status === 'resolved').length;
  const activeIssues = localIssues.filter(i => i.status !== 'resolved').length;
  const totalUpvotes = localIssues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live issues from Supabase or LocalDB
      const fetchedIssues = await supabaseSvc.fetchIssues();
      setLocalIssues(fetchedIssues);

      // 2. Fetch profiles for Leaderboard
      const fetchedProfiles = await supabaseSvc.fetchProfiles();
      setProfiles(fetchedProfiles);

      // 3. Populate a combined live timeline of activities
      const allActivities: any[] = [];
      
      // Load recent verifications and comments for recent issues to create live logs
      const subPromises = fetchedIssues.slice(0, 12).map(async (issue) => {
        try {
          const [verifs, comms] = await Promise.all([
            supabaseSvc.fetchVerifications(issue.id),
            supabaseSvc.fetchComments(issue.id)
          ]);
          return { issue, verifs, comms };
        } catch {
          return { issue, verifs: [], comms: [] };
        }
      });

      const results = await Promise.all(subPromises);
      results.forEach(({ issue, verifs, comms }) => {
        verifs.forEach(v => {
          allActivities.push({
            id: v.id,
            type: 'verification',
            userName: v.user_name,
            issueTitle: issue.title,
            issueId: issue.id,
            detail: `Verified status: "${v.status.toUpperCase()}" - ${v.comments || 'No comment'}`,
            timestamp: v.created_at
          });
        });

        comms.forEach(c => {
          allActivities.push({
            id: c.id,
            type: 'comment',
            userName: c.user_name,
            issueTitle: issue.title,
            issueId: issue.id,
            detail: `Commented: "${c.content}"`,
            timestamp: c.created_at
          });
        });
      });

      // Also add issue creations
      fetchedIssues.forEach(i => {
        allActivities.push({
          id: `create-${i.id}`,
          type: 'report',
          userName: i.reporter_name || 'Resident',
          issueTitle: i.title,
          issueId: i.id,
          detail: `Reported issue under "${i.category}" category`,
          timestamp: i.created_at
        });
      });

      // Sort descending by time
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities.slice(0, 20));
    } catch (err) {
      console.error('Failed to load home dashboard sync data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [issues]);

  // Handle Save DB
  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      if (!dbUrl || !dbKey) {
        setTestResult({ success: false, message: 'Both URL and Key are required.' });
        setTesting(false);
        return;
      }

      const success = supabaseSvc.initialize(dbUrl, dbKey);
      if (success) {
        setTestResult({ 
          success: true, 
          message: 'Connected and synchronized with live Supabase database successfully!' 
        });
        setTimeout(() => {
          setShowDbConfig(false);
          setTestResult(null);
          window.location.reload();
        }, 1500);
      } else {
        setTestResult({ success: false, message: 'Invalid Supabase credential format.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnectDb = () => {
    supabaseSvc.disconnect();
    setTestResult({ success: true, message: 'Database disconnected. Switched to sandbox local storage mode.' });
    setTimeout(() => {
      setTestResult(null);
      window.location.reload();
    }, 1200);
  };

  // Upvote issue from Home
  const handleUpvoteClick = async (e: React.MouseEvent, issueId: string) => {
    e.stopPropagation();
    const currentUpvotes = await supabaseSvc.upvoteIssue(issueId);
    setLocalIssues(prev => prev.map(i => i.id === issueId ? { ...i, upvotes: currentUpvotes } : i));
  };

  // Expand issue details & load comments/verifications
  const handleExpandIssue = async (issueId: string) => {
    if (expandedIssueId === issueId) {
      setExpandedIssueId(null);
      return;
    }

    setExpandedIssueId(issueId);
    try {
      const [comms, verifs] = await Promise.all([
        supabaseSvc.fetchComments(issueId),
        supabaseSvc.fetchVerifications(issueId)
      ]);
      setCommentsMap(prev => ({ ...prev, [issueId]: comms }));
      setVerificationsMap(prev => ({ ...prev, [issueId]: verifs }));
    } catch (err) {
      console.error('Error fetching expanded details:', err);
    }
  };

  // Post guest comment
  const handlePostComment = async (e: React.FormEvent, issueId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const author = guestName.trim() || 'Anonymous Resident';
    try {
      const newComm = await supabaseSvc.addComment(issueId, 'guest-user', author, newCommentText);
      setCommentsMap(prev => ({
        ...prev,
        [issueId]: [newComm, ...(prev[issueId] || [])]
      }));
      setNewCommentText('');
      // Refresh timeline
      loadHomeData();
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  // Post guest verification
  const handlePostVerification = async (e: React.FormEvent, issueId: string) => {
    e.preventDefault();
    if (!newVerifComment.trim()) return;

    const author = guestName.trim() || 'Anonymous Resident';
    try {
      const newVerif = await supabaseSvc.addVerification(issueId, 'guest-user', author, newVerifStatus, newVerifComment);
      setVerificationsMap(prev => ({
        ...prev,
        [issueId]: [newVerif, ...(prev[issueId] || [])]
      }));

      // Automatically change status in local UI state if verified
      if (newVerifStatus === 'verified') {
        await supabaseSvc.updateIssueStatus(issueId, 'validated');
      }

      setNewVerifComment('');
      // Refresh issue list and timeline
      loadHomeData();
    } catch (err) {
      console.error('Error posting verification:', err);
    }
  };

  // Submit Issue
  const handleQuickSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDesc.trim()) return;

    // Map Category to Department
    let dept = 'Infrastructure';
    if (reportCategory === 'Pothole') dept = 'Roads';
    else if (reportCategory === 'Water Leakage') dept = 'Water & Sewage';
    else if (reportCategory === 'Damaged Streetlight') dept = 'Electricity';
    else if (reportCategory === 'Waste Management') dept = 'Sanitation';

    const newIssuePayload = {
      title: reportTitle,
      description: reportDesc,
      category: reportCategory,
      status: 'reported' as IssueStatus,
      latitude: 37.7749 + (Math.random() - 0.5) * 0.02, // Random SF offset
      longitude: -122.4194 + (Math.random() - 0.5) * 0.02,
      reporter_id: 'guest-reporter',
      reporter_name: reportGuestName.trim() || 'Anonymous Citizen',
      department: dept,
      image_url: reportImg.trim() || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'
    };

    try {
      await supabaseSvc.saveIssue(newIssuePayload);
      setReportTitle('');
      setReportDesc('');
      setReportGuestName('');
      setReportImg('');
      setShowReportForm(false);
      loadHomeData();
    } catch (err) {
      console.error('Error saving guest reported issue:', err);
    }
  };

  // Filter issues
  const filteredIssues = localIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      
      {/* 1. Header */}
      <header className="bg-white border-b border-gray-150 py-3 px-6 sticky top-0 z-40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-orange-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-orange-600/10">
            CH
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-800 leading-none uppercase tracking-widest flex items-center gap-2">
              CivicHero
            </h1>
            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Municipal Dispatch Portal</span>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-6 my-1 sm:my-0">
          <button 
            onClick={() => {
              setShowReportForm(true);
              setTimeout(() => {
                document.getElementById('report-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
            className="text-xs font-bold text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋 Report Issue</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('leaderboard');
              setTimeout(() => {
                document.getElementById('main-grid-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-xs font-bold text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏆 Leaderboard</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onNavigate('login')}
            className="text-xs font-bold text-gray-700 hover:text-orange-600 px-3.5 py-1.5 border border-gray-200 bg-white rounded-lg transition-colors cursor-pointer"
          >
            Staff Sign In
          </button>
        </div>
      </header>

      {/* 2. Hero Presentation with Fast Login Actions */}
      <section className="bg-white border-b border-gray-150 py-12 px-6 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ea580c 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-full">
              <Sparkles size={11} className="animate-pulse" />
              <span>Real-Time Civic Action Engine</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight">
              Hyperlocal Problem Solving <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Directly From the Map</span>
            </h2>

            <p className="text-xs md:text-sm text-gray-500 max-w-xl leading-relaxed">
              Synchronize live comments, verifications, citizen status upvotes, and allow field workers/dispatchers to log in to coordinate repairs in real-time.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-5 rounded-lg shadow-lg shadow-orange-600/15 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Municipal Staff Portal</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Quick Report Issue</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-orange-50/40 border border-orange-100 p-6 rounded-2xl space-y-4 text-left flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-32 w-full overflow-hidden rounded-xl bg-orange-100 border border-orange-200/50 relative">
                <img 
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80" 
                  alt="Municipal Operations Center" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-950/20 to-transparent" />
              </div>
              
              <h4 className="text-[10px] font-black uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-orange-600" />
                <span>Municipal Dispatch Status</span>
              </h4>
              <p className="text-xs text-orange-950 font-medium leading-relaxed">
                This system coordinates field repairs directly with city maintenance crews. Resident feedback is triaged immediately and dispatched to on-duty technicians.
              </p>
            </div>
            
            <div className="pt-3 border-t border-orange-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-orange-800 font-semibold uppercase">
                <span>Dispatch Status:</span>
                <span className="text-green-700 font-black flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Online &amp; Active</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-orange-800 font-semibold uppercase">
                <span>Response Target:</span>
                <span className="text-orange-700 font-black">&lt; 24 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Statistics */}
      <section className="bg-gray-50 border-b border-gray-200 py-6 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">Community Incidents</span>
            <span className="text-2xl font-black text-gray-800">{totalIssues}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Total Reported</span>
          </div>

          <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">In Progress / Review</span>
            <span className="text-2xl font-black text-amber-600">{activeIssues}</span>
            <span className="text-[10px] text-amber-500 block mt-0.5">Active Queue</span>
          </div>

          <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">Remedied Fixes</span>
            <span className="text-2xl font-black text-green-700">{resolvedIssues}</span>
            <span className="text-[10px] text-green-600 block mt-0.5">Fully Resolved</span>
          </div>

          <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">Citizen Verifications</span>
            <span className="text-2xl font-black text-orange-600">{totalUpvotes}</span>
            <span className="text-[10px] text-orange-500 block mt-0.5">Upvotes / Confirms</span>
          </div>
        </div>
      </section>

      {/* Illustrated Municipal Pillars & Action Sectors */}
      <section className="bg-white border-b border-gray-150 py-10 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider rounded-md">
              <Building2 size={11} />
              <span>Target Remediation Operations</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 tracking-tight font-sans">
              Hyperlocal Civic Maintenance &amp; Repair Focus Sectors
            </h3>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              Every reported incident is cataloged into one of our specialized city departments, enabling dispatchers to automatically assign targeted municipal work crews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            
            {/* 1. Road Restoration */}
            <div className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="h-32 w-full overflow-hidden relative bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80" 
                  alt="Road repairs" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2.5 left-2.5 bg-gray-900/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                  <Wrench size={10} />
                  <span>Roads Dept</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sector 01</span>
                <h4 className="font-extrabold text-xs text-gray-800 tracking-tight">Asphalt &amp; Potholes</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Fixing high-risk tarmac splits, severe pavement sinkholes, and grading public roads for smooth automotive navigation.
                </p>
              </div>
            </div>

            {/* 2. Water Systems */}
            <div className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="h-32 w-full overflow-hidden relative bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80" 
                  alt="Water maintenance" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2.5 left-2.5 bg-gray-900/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                  <Activity size={10} />
                  <span>Water &amp; Sewage</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sector 02</span>
                <h4 className="font-extrabold text-xs text-gray-800 tracking-tight">Water Main Failures</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Managing active line bursts, restoring pressure seals, repairing storm sewers, and preventing urban freshwater waste.
                </p>
              </div>
            </div>

            {/* 3. Electrical Infrastructure */}
            <div className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="h-32 w-full overflow-hidden relative bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80" 
                  alt="Streetlights" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2.5 left-2.5 bg-gray-900/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Electricity Dept</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sector 03</span>
                <h4 className="font-extrabold text-xs text-gray-800 tracking-tight">Illumination &amp; Cabling</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Repairing burnt out street lanterns, troubleshooting grid shorts, and securing dark alleys with functional public light networks.
                </p>
              </div>
            </div>

            {/* 4. Sanitation and Ecology */}
            <div className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="h-32 w-full overflow-hidden relative bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80" 
                  alt="Illegal dumping cleanup" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-2.5 left-2.5 bg-gray-900/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                  <Building2 size={10} />
                  <span>Sanitation Dept</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sector 04</span>
                <h4 className="font-extrabold text-xs text-gray-800 tracking-tight">Eco Waste &amp; Dumping</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Clearing massive illegal tire deposits, safe removal of toxic chemical spills, and restoring pristine local forest reserves.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Main Collaborative Grid (Report, Issues, Leaderboard, Notifications) */}
      <section id="main-grid-section" className="max-w-6xl w-full mx-auto px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Content Area: Issues Feed & Leaderboard */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Guest Report Form (Responsive, animated) */}
          {showReportForm && (
            <div id="report-form-section" className="bg-white border-2 border-orange-200 rounded-3xl shadow-xl p-6 space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-800">Quick Report Community Issue</h3>
                    <p className="text-[10px] text-gray-400">File a public ticket instantly without an account</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportForm(false)}
                  className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleQuickSubmitIssue} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Your Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={reportGuestName}
                    onChange={(e) => setReportGuestName(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Issue Category</label>
                  <select 
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="Pothole">🕳️ Pothole / Road split</option>
                    <option value="Water Leakage">💧 Water Leakage / Burst Pipe</option>
                    <option value="Damaged Streetlight">💡 Damaged Streetlight</option>
                    <option value="Waste Management">🚮 Waste / Illegal Dumping</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Short Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Damaged asphalt on 4th cross junction"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Detailed Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Provide exact coordinates, depth, street landmarks, or safety hazards..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium resize-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Incident Image URL (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/... (or leave blank for automatic department placeholder)"
                    value={reportImg}
                    onChange={(e) => setReportImg(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xs rounded-lg hover:from-orange-500 hover:to-red-500 shadow-md shadow-orange-500/10 transition-colors cursor-pointer"
                  >
                    Submit Report Live
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Navigation Tab bar with Beautiful Minimal Indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'issues' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>🗺️ Active Issues Feed</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                  activeTab === 'issues' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {filteredIssues.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'leaderboard' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>🏆 Hero Leaderboard</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                  activeTab === 'leaderboard' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {profiles.length > 0 ? profiles.length : '4'}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'activity' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>🔔 Live System Activity</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                  activeTab === 'activity' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {activities.length}
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowReportForm(true);
                setTimeout(() => {
                  document.getElementById('report-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className="text-xs font-black text-orange-600 hover:text-orange-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 border border-orange-150 self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} />
              <span>Raise New Issue</span>
            </button>
          </div>

          {/* Tab 1: Issues Feed */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="bg-white border border-gray-200 p-3 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-3 text-gray-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search active community issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto items-center">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="all">📁 All Categories</option>
                    <option value="Pothole">🕳️ Potholes</option>
                    <option value="Water Leakage">💧 Water Leaks</option>
                    <option value="Damaged Streetlight">💡 Streetlights</option>
                    <option value="Waste Management">🚮 Waste Dumping</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="all">🚦 All Statuses</option>
                    <option value="reported">🔴 Reported</option>
                    <option value="validated">🟡 Validated</option>
                    <option value="in_progress">🟠 In Progress</option>
                    <option value="resolved">🟢 Resolved</option>
                  </select>
                </div>
              </div>

              {/* Loader */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-150">
                  <div className="h-7 w-7 border-2 border-t-transparent border-orange-600 rounded-full animate-spin mb-2" />
                  <span className="text-[11px] text-gray-400 font-bold">Synchronizing live issue registers...</span>
                </div>
              )}

              {/* Feed List (Always beautifully populated with interactive cards) */}
              {!loading && filteredIssues.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-150 p-8 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-gray-800">No matching issues reported</h5>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      All citizen reports are currently resolved or there is no issue matching your search filter. Use the "Raise New Issue" button to file one!
                    </p>
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredIssues.map((issue) => {
                      const isExpanded = expandedIssueId === issue.id;
                      const comments = commentsMap[issue.id] || [];
                      const verifications = verificationsMap[issue.id] || [];

                      return (
                        <div 
                          key={issue.id}
                          onClick={() => handleExpandIssue(issue.id)}
                          className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer ${
                            isExpanded ? 'ring-2 ring-orange-500/20 border-orange-300 shadow-md' : 'border-gray-200'
                          }`}
                        >
                          <div className="p-5 flex gap-5 items-start">
                            {issue.image_url && (
                              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-150 relative shadow-inner">
                                <img 
                                  src={issue.image_url} 
                                  alt={issue.title} 
                                  referrerPolicy="no-referrer" 
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/[0.04]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded border border-orange-100">
                                  {issue.category}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded border flex items-center gap-1 ${
                                  issue.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                  issue.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  issue.status === 'validated' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    issue.status === 'resolved' ? 'bg-green-500' :
                                    issue.status === 'in_progress' ? 'bg-amber-500' :
                                    issue.status === 'validated' ? 'bg-orange-500' : 'bg-red-500'
                                  }`} />
                                  <span>{issue.status}</span>
                                </span>
                                {issue.department && (
                                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                    {issue.department} Dept
                                  </span>
                                )}
                              </div>

                              <div>
                                <h4 className="font-extrabold text-gray-800 text-sm leading-snug tracking-tight hover:text-orange-600 transition-colors">
                                  {issue.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 font-sans leading-relaxed mt-1 line-clamp-2">
                                  {issue.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 font-bold flex-wrap gap-3">
                                <div className="flex items-center gap-1">
                                  <MapPin size={11} className="text-gray-300" />
                                  <span>Location: <strong className="text-gray-600 font-extrabold">San Francisco, CA</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={11} className="text-gray-300" />
                                  <span>Reported {new Date(issue.created_at).toLocaleDateString()} by <strong className="text-gray-600 font-extrabold">{issue.reporter_name}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center shrink-0 ml-2">
                              <button
                                onClick={(e) => handleUpvoteClick(e, issue.id)}
                                className="h-11 w-11 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-full border border-gray-200 flex flex-col items-center justify-center transition-all group shadow-xs cursor-pointer"
                              >
                                <ThumbsUp size={12} className="group-hover:scale-115 transition-transform" />
                                <span className="text-[10px] font-black mt-0.5">{issue.upvotes || 0}</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Comments & Resident Verifications Section */}
                          {isExpanded && (
                            <div 
                              className="bg-gray-50 border-t border-gray-150 p-5 space-y-5 text-xs font-sans animate-fade-in"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                
                                {/* Verifications Panel */}
                                <div className="space-y-3">
                                  <h5 className="font-black text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                                    <ShieldCheck size={14} className="text-green-600" />
                                    <span>Resident Verifications ({verifications.length})</span>
                                  </h5>

                                  {/* Verification Form */}
                                  <form onSubmit={(e) => handlePostVerification(e, issue.id)} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5 shadow-sm">
                                    <span className="text-[10px] font-black text-gray-600 uppercase block">Submit Spot Validation</span>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text"
                                        placeholder="Your Name"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg w-1/2 focus:outline-none focus:bg-white text-gray-800"
                                      />
                                      <select
                                        value={newVerifStatus}
                                        onChange={(e: any) => setNewVerifStatus(e.target.value)}
                                        className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg w-1/2 focus:outline-none focus:bg-white font-extrabold text-gray-700 cursor-pointer"
                                      >
                                        <option value="verified">✅ Verify (True)</option>
                                        <option value="disputed">❌ Dispute (False)</option>
                                      </select>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="text"
                                        placeholder="Add support comments..."
                                        required
                                        value={newVerifComment}
                                        onChange={(e) => setNewVerifComment(e.target.value)}
                                        className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex-1 focus:outline-none focus:bg-white text-gray-800"
                                      />
                                      <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 rounded-lg cursor-pointer">
                                        Send
                                      </button>
                                    </div>
                                  </form>

                                  {/* Verifications List */}
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {verifications.length === 0 ? (
                                      <span className="text-[10px] text-gray-400 block italic py-2">No validations submitted yet. Be the first to verify.</span>
                                    ) : (
                                      verifications.map((v) => (
                                        <div key={v.id} className="bg-white border border-gray-150 p-3 rounded-xl shadow-xs text-xs space-y-1">
                                          <div className="flex justify-between font-extrabold text-gray-700">
                                            <span>{v.user_name}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                              v.status === 'verified' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                              {v.status}
                                            </span>
                                          </div>
                                          <p className="text-gray-500 font-sans leading-relaxed">{v.comments}</p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Comments Panel */}
                                <div className="space-y-3">
                                  <h5 className="font-black text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                                    <MessageSquare size={14} className="text-orange-600" />
                                    <span>Community Discussion ({comments.length})</span>
                                  </h5>

                                  {/* Comment Form */}
                                  <form onSubmit={(e) => handlePostComment(e, issue.id)} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5 shadow-sm">
                                    <span className="text-[10px] font-black text-gray-600 uppercase block">Write Comment</span>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text"
                                        placeholder="Name"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg w-1/3 focus:outline-none focus:bg-white text-gray-800"
                                      />
                                      <input 
                                        type="text"
                                        placeholder="Write a message..."
                                        required
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex-1 focus:outline-none focus:bg-white text-gray-800"
                                      />
                                      <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 rounded-lg flex items-center justify-center cursor-pointer">
                                        <Send size={12} />
                                      </button>
                                    </div>
                                  </form>

                                  {/* Comments list */}
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {comments.length === 0 ? (
                                      <span className="text-[10px] text-gray-400 block italic py-2">No discussion yet. Ask questions or post details!</span>
                                    ) : (
                                      comments.map((c) => (
                                        <div key={c.id} className="bg-white border border-gray-150 p-3 rounded-xl shadow-xs text-xs space-y-1">
                                          <div className="flex justify-between font-extrabold text-gray-700">
                                            <span>{c.user_name}</span>
                                            <span className="text-[9px] text-gray-400 font-bold">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-gray-500 font-sans leading-relaxed">{c.content}</p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* Tab 2: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-lg shadow-sm border border-orange-100">
                  🏆
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">Community Heroes Leaderboard</h4>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Residents are awarded points (+20 for reporting, +5 for verifying, +10 for discussion) for active civic stewardship.
                  </p>
                </div>
              </div>

              {/* Leaderboard Podium Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {(profiles.length > 0 ? profiles.slice(0, 3) : [
                  { id: '1', full_name: 'Yuki Sato', role: 'Active Resident', points: 340 },
                  { id: '2', full_name: 'Elena Rostova', role: 'Field Inspector', points: 290 },
                  { id: '3', full_name: 'Marcus Brody', role: 'Street Advocate', points: 180 }
                ]).map((profile, i) => (
                  <div key={profile.id} className="border border-gray-150 rounded-2xl p-5 flex flex-col items-center text-center relative bg-gray-50/50 hover:border-orange-300 hover:shadow-md transition-all">
                    <span className="absolute top-3 left-3 h-6 w-6 bg-orange-100 text-orange-700 font-black text-[10px] rounded-full flex items-center justify-center border border-orange-250">
                      #{i + 1}
                    </span>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 text-white font-black text-xs flex items-center justify-center shadow-md mb-3">
                      {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'H'}
                    </div>
                    <span className="text-xs font-extrabold text-gray-800 block truncate w-full">{profile.full_name}</span>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-3 uppercase tracking-wider">{profile.role}</span>
                    <span className="text-xs font-black text-orange-600 bg-white border border-orange-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                      <Flame size={12} className="text-red-500 animate-pulse" />
                      <span>{profile.points || 0} pts</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Remaining leaderboard list */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-150">
                {(profiles.length > 3 ? profiles.slice(3) : [
                  { id: '4', full_name: 'Amara Walker', role: 'Eco Volunteer', points: 140 },
                  { id: '5', full_name: 'Devon Lee', role: 'Traffic Warden', points: 95 }
                ]).map((profile, index) => (
                  <div key={profile.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-gray-400 w-5">#{index + 4}</span>
                      <div className="h-8 w-8 rounded-full bg-gray-100 font-bold text-[10px] flex items-center justify-center text-gray-600 border border-gray-200">
                        {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-800 block">{profile.full_name}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold mt-0.5">{profile.role}</span>
                      </div>
                    </div>
                    <span className="font-bold text-orange-600 font-mono text-xs">{profile.points} points</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Live Activities Timeline */}
          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                    <Activity size={16} />
                  </div>
                  <h4 className="font-extrabold text-gray-800 text-sm">Community Live Logs Timeline</h4>
                </div>
                <span className="text-[9px] text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md font-black uppercase tracking-wider">Stream Active</span>
              </div>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto text-sm animate-pulse">
                      🔔
                    </div>
                    <p className="text-xs text-gray-400 italic">No community logs recorded recently. Raise an issue to broadcast a log!</p>
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex gap-3.5 text-xs border-b border-gray-100 pb-4 last:border-0 last:pb-0 items-start hover:bg-gray-50/25 p-1 rounded-xl transition-colors">
                      <span className="h-7 w-7 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 flex items-center justify-center shrink-0 text-xs mt-0.5 shadow-xs">
                        {act.type === 'comment' ? '💬' : act.type === 'verification' ? '✅' : '🔴'}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-black flex-wrap gap-2 uppercase tracking-wide">
                          <span>{act.userName}</span>
                          <span>{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed font-sans text-xs">
                          {act.detail} on <strong className="text-orange-600 hover:underline cursor-pointer font-extrabold" onClick={() => { setActiveTab('issues'); handleExpandIssue(act.issueId); }}>"{act.issueTitle}"</strong>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Content Area: Mission Objectives, Dispatch Logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Mission Objective Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl pointer-events-none" />
            <h4 className="font-extrabold text-gray-800 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-gray-100 pb-2">
              <span>Community Hero Mission</span>
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              CivicHero helps residents flag physical splits, open holes, water leakages, and dark alleyways. Municipal departments utilize centralized queues to assign technicians, and workers log in from the field to post resolution photographs.
            </p>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <button 
                onClick={() => onNavigate('login')}
                className="w-full text-center bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition-colors shadow-md shadow-orange-600/10 cursor-pointer"
              >
                Municipal Staff Sign In
              </button>
            </div>
          </div>

          {/* Quick Demo Accounts Helper */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit size={13} className="text-orange-600" />
                <span>Simulated Role Portals</span>
              </h4>
              <p className="text-[10px] text-gray-400">Instantly sign in with any mock profile to test features</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={() => onQuickDemoLogin('public')}
                className="p-2.5 border border-gray-150 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-left transition-all group cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-gray-700 block group-hover:text-orange-700">Resident</span>
                <span className="text-[9px] text-gray-400 block font-medium">Verify &amp; Report</span>
              </button>

              <button 
                onClick={() => onQuickDemoLogin('worker')}
                className="p-2.5 border border-gray-150 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-left transition-all group cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-gray-700 block group-hover:text-orange-700">Field Crew</span>
                <span className="text-[9px] text-gray-400 block font-medium">Post Fix Updates</span>
              </button>

              <button 
                onClick={() => onQuickDemoLogin('department')}
                className="p-2.5 border border-gray-150 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-left transition-all group cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-gray-700 block group-hover:text-orange-700">Dispatcher</span>
                <span className="text-[9px] text-gray-400 block font-medium">Assign Workers</span>
              </button>

              <button 
                onClick={() => onQuickDemoLogin('admin')}
                className="p-2.5 border border-gray-150 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-left transition-all group cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-gray-700 block group-hover:text-orange-700">Supervisor</span>
                <span className="text-[9px] text-gray-400 block font-medium">Department Control</span>
              </button>
            </div>
          </div>

          {/* Interactive Live City Metrics Preview */}
          <div className="bg-gray-900 text-white border border-gray-800 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">SF Central Dispatch Stream</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-gray-800/50 pb-1.5">
                <span className="text-gray-400">Total Crews Out:</span>
                <span className="text-white font-extrabold">14 On-duty Teams</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/50 pb-1.5">
                <span className="text-gray-400">Active SLA Speed:</span>
                <span className="text-green-400 font-extrabold">94.2% on target</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/50 pb-1.5">
                <span className="text-gray-400">Most Active Sector:</span>
                <span className="text-amber-400 font-extrabold">Road Potholes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">System Code:</span>
                <span className="text-gray-400 font-semibold">CivicHero-Node-01</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 5. How It Works Section */}
      <section className="bg-gray-50 border-t border-b border-gray-150 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">The Repair Loop</span>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">How CivicHero Closes the Loop</h3>
            <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
              Transparent, accountable, and fast communication from citizen report to technician resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2.5 text-center relative hover:shadow-md transition-all">
              <div className="h-8 w-8 bg-orange-50 text-orange-600 font-black text-xs rounded-lg flex items-center justify-center mx-auto border border-orange-100 shadow-sm">
                1
              </div>
              <h4 className="text-xs font-black text-gray-800">Resident Flags</h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                Citizen spots an issue (e.g. pothole), files a public ticket with details, images, and geolocation instantly.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2.5 text-center relative hover:shadow-md transition-all">
              <div className="h-8 w-8 bg-orange-50 text-orange-600 font-black text-xs rounded-lg flex items-center justify-center mx-auto border border-orange-100 shadow-sm">
                2
              </div>
              <h4 className="text-xs font-black text-gray-800">Community Backs</h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                Other neighbors upvote, leave comments, and verify whether the threat is real, increasing urgency.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2.5 text-center relative hover:shadow-md transition-all">
              <div className="h-8 w-8 bg-orange-50 text-orange-600 font-black text-xs rounded-lg flex items-center justify-center mx-auto border border-orange-100 shadow-sm">
                3
              </div>
              <h4 className="text-xs font-black text-gray-800">Supervisor Dispatches</h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                City dispatchers review, validate, select specialized workers, and assign them directly to on-duty crews.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2.5 text-center relative hover:shadow-md transition-all">
              <div className="h-8 w-8 bg-orange-50 text-orange-600 font-black text-xs rounded-lg flex items-center justify-center mx-auto border border-orange-100 shadow-sm">
                4
              </div>
              <h4 className="text-xs font-black text-gray-800">Field Crew Resolves</h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                Field teams complete asphalt / water / light fix, snap a photo proof, and mark the ticket resolved live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Premium Multi-Column Brand Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Logo and Tagline Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center font-black text-white text-base tracking-tighter shadow-md shadow-orange-600/10">
                CH
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">CivicHero</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-sans">
              Accelerating community maintenance, visual defect remediation, and repair dispatching through live public accountability and lightning-fast municipal crew coordination.
            </p>
            <div className="text-[11px] text-gray-300">
              © 2026 CivicHero Operations, Inc. <br />All simulated systems are active.
            </div>
          </div>

          {/* Column 2: Municipal Services */}
          <div className="md:col-span-2.5 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-gray-800 tracking-wider">Staff Resources</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-sans">
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Dispatcher Console
                </button>
              </li>
              <li>
                <button onClick={() => onQuickDemoLogin('worker')} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Field Worker Login
                </button>
              </li>
              <li>
                <button onClick={() => onQuickDemoLogin('department')} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Supervisor Dashboard
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-orange-600 transition-colors">Emergency Protocol</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Community Resilience */}
          <div className="md:col-span-2.5 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-gray-800 tracking-wider">Citizen Actions</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-sans">
              <li>
                <button onClick={() => { setActiveTab('issues'); document.getElementById('main-grid-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Active Issues Feed
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('leaderboard'); document.getElementById('main-grid-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Community Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('activity'); document.getElementById('main-grid-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-orange-600 transition-colors cursor-pointer text-left">
                  Timeline Stream
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-orange-600 transition-colors">Help Center / Guidelines</a>
              </li>
            </ul>
          </div>

          {/* Column 4: System Telemetry */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-gray-800 tracking-wider">SLA Service Targets</h4>
            <div className="space-y-2 bg-gray-50 border border-gray-150 p-3 rounded-xl">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 font-mono">
                <span>Pothole Resolution:</span>
                <span className="text-orange-600">&lt; 48 hours</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-500 font-mono">
                <span>Water Main Seal:</span>
                <span className="text-orange-600">&lt; 12 hours</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-500 font-mono">
                <span>Streetlight Cabling:</span>
                <span className="text-orange-600">&lt; 24 hours</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md font-black uppercase tracking-wider self-start w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>SF Municipal Dispatch Node Online</span>
            </div>
          </div>

        </div>

        {/* Footer Sub-bar */}
        <div className="bg-gray-50 border-t border-gray-150 py-5 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3 font-sans">
            <span>Designed with ultimate clarity and modern precision for city operations.</span>
            <div className="flex gap-4 font-bold">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600">Terms of Service</a>
              <a href="#" className="hover:text-gray-600">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
