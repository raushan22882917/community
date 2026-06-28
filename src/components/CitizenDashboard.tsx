import React from 'react';
import { Issue, Profile } from '../types';
import { 
  Smartphone, 
  MapPin, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlusCircle,
  TrendingUp,
  Coins,
  ChevronRight,
  ShieldCheck,
  User,
  CheckCircle
} from 'lucide-react';

interface CitizenDashboardProps {
  issues: Issue[];
  activeProfile: Profile;
  onOpenReportModal: () => void;
  onSelectIssue: (issue: Issue) => void;
  onTabChange: (tab: 'map' | 'dashboard' | 'insights' | 'database') => void;
}

export default function CitizenDashboard({
  issues,
  activeProfile,
  onOpenReportModal,
  onSelectIssue,
  onTabChange
}: CitizenDashboardProps) {
  // Filter claims (issues) created by this specific citizen
  const citizenClaims = issues.filter(i => i.reporter_id === activeProfile.id);
  
  // Calculate stats
  const totalPoints = activeProfile.points;
  const resolvedClaims = citizenClaims.filter(i => i.status === 'resolved').length;
  const activeClaims = citizenClaims.length - resolvedClaims;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'validated':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'in_progress':
        return 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reported': return 'Report Filed';
      case 'validated': return 'Community Confirmed';
      case 'in_progress': return 'Crew Dispatched';
      case 'resolved': return 'Resolved & Closed';
      default: return status;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* 1. Left side: The Simulated Citizen Mobile App frame */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="w-full max-w-[370px] bg-gray-100 border-[10px] border-gray-800 rounded-[42px] shadow-2xl relative overflow-hidden aspect-[9/18] flex flex-col">
          {/* Mobile Status Bar */}
          <div className="h-6 bg-gray-800 px-5 pt-1.5 flex justify-between items-center text-[10px] text-gray-400 font-mono select-none shrink-0 z-10">
            <span>9:41 AM</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 bg-gray-600 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-gray-400 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Mobile Speaker / Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-850 rounded-b-xl z-20 flex items-center justify-center">
            <div className="w-8 h-1 bg-gray-900 rounded-full" />
          </div>

          {/* App Screen Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-6 bg-gray-50">
            {/* Header Identity */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 p-0.5">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                    <User size={14} className="text-green-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{activeProfile.full_name}</h4>
                  <p className="text-[9px] text-green-600 font-semibold">Level 4 Citizen Hero</p>
                </div>
              </div>
              <div className="bg-white px-2 py-1 rounded-lg border border-gray-200 flex items-center gap-1 shadow-sm">
                <Coins size={11} className="text-orange-500" />
                <span className="text-[10px] font-mono font-bold text-gray-700">{totalPoints}</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={onOpenReportModal}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle size={15} />
              <span>Report Local Problem</span>
            </button>

            {/* Micro Tracker Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] text-gray-400 block uppercase font-mono">Your Claims</span>
                <span className="text-lg font-bold text-gray-800 mt-1 block">{citizenClaims.length}</span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] text-gray-400 block uppercase font-mono">Resolved</span>
                <span className="text-lg font-bold text-green-600 mt-1 block">{resolvedClaims}</span>
              </div>
            </div>

            {/* My Active Claims List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">My Reported Issues</span>
                <span className="text-[9px] text-gray-400">{activeClaims} pending</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {citizenClaims.length === 0 ? (
                  <div className="p-6 bg-white border border-dashed border-gray-200 rounded-xl text-center">
                    <p className="text-[10px] text-gray-400 italic">No claims filed yet. File a report using the orange button above!</p>
                  </div>
                ) : (
                  citizenClaims.map(claim => (
                    <div
                      key={claim.id}
                      onClick={() => {
                        onSelectIssue(claim);
                        onTabChange('map');
                      }}
                      className="bg-white border border-gray-200 p-2.5 rounded-xl space-y-1.5 hover:border-orange-500/30 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="text-[11px] font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">{claim.title}</h5>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border shrink-0 ${getStatusBadge(claim.status)}`}>
                          {claim.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-400">
                        <span className="font-mono">{claim.category}</span>
                        <div className="flex items-center gap-1">
                          <span>Upvotes: {claim.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom System Navigation Hint */}
            <div className="bg-gray-900 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck size={12} className="text-green-400" />
                <span>Supabase RLS Active</span>
              </div>
              <span className="text-[9px] font-mono text-green-400">ROLE_PUBLIC</span>
            </div>
          </div>

          {/* iPhone Home Indicator bar */}
          <div className="h-4 bg-gray-800 flex items-center justify-center pb-1 shrink-0 select-none">
            <div className="w-28 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* 2. Right side: Gamification instructions and claims history metrics */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg border border-green-100">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Hyperlocal Citizen Rewards Program</h3>
              <p className="text-xs text-gray-500">Your profile automatically accumulates points securely inside the Supabase database. Earn status ranks and badges by supporting your neighborhood.</p>
            </div>
          </div>

          {/* Milestones / Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <span className="text-orange-500">✦</span>
                <span>Reporting (+20 PTS)</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Submit accurate problems with photographic evidence. Our integrated <strong>Gemini AI</strong> suggests departments and priorities, expediting dispatch routing.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <span className="text-green-500">✦</span>
                <span>Verification (+5 PTS)</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Verify pending claims on site. Positive verifications automatically flag problems as "Validated" to alert dispatch controllers.
              </p>
            </div>
          </div>
        </div>

        {/* Claims Tracking Dashboard Timeline */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Claims Status Timeline</h3>
          
          {citizenClaims.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-150">
              <p className="text-xs text-gray-400 italic">No issues reported under Elena Rostova's account. Select the Resident viewpoint in the sidebar role switcher or click the "Report Problem" button to submit your first claim!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {citizenClaims.slice(0, 3).map((claim) => (
                <div key={claim.id} className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-orange-500" />
                      <span className="text-xs font-bold text-gray-700 truncate max-w-sm">{claim.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{new Date(claim.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Flow tracker indicators */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`p-2 rounded text-center border text-[10px] font-bold ${
                      ['reported', 'validated', 'in_progress', 'resolved'].includes(claim.status)
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      1. Reported
                    </div>
                    <div className={`p-2 rounded text-center border text-[10px] font-bold ${
                      ['validated', 'in_progress', 'resolved'].includes(claim.status)
                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      2. Validated
                    </div>
                    <div className={`p-2 rounded text-center border text-[10px] font-bold ${
                      ['in_progress', 'resolved'].includes(claim.status)
                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      3. Dispatched
                    </div>
                    <div className={`p-2 rounded text-center border text-[10px] font-bold ${
                      claim.status === 'resolved'
                        ? 'bg-green-600 text-white border-transparent'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      4. Resolved
                    </div>
                  </div>

                  {/* Dynamic footer status statement */}
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Current stage: <strong className="text-gray-700">{getStatusText(claim.status)}</strong>. {
                      claim.status === 'resolved' 
                        ? `Audit Note: "${claim.resolution_note || 'The problem has been resolved'}"`
                        : claim.status === 'in_progress'
                        ? `Worker ${claim.assigned_worker_name || 'Marcus'} is currently addressing the problem.`
                        : 'Awaiting local dispatcher assessment and worker assignment.'
                    }
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
