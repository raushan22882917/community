import React, { useState } from 'react';
import { Issue, Profile } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Trash2, 
  CheckCircle, 
  PlusCircle, 
  UserPlus, 
  Users, 
  CheckSquare, 
  XOctagon,
  RefreshCw,
  Coins
} from 'lucide-react';
import { supabaseSvc } from '../supabase';

interface AdminDashboardProps {
  issues: Issue[];
  onRefresh: () => Promise<void>;
  onResetData: () => void;
  onSelectIssue: (issue: Issue) => void;
  onTabChange: (tab: 'map' | 'dashboard' | 'insights' | 'database') => void;
}

export default function AdminDashboard({
  issues,
  onRefresh,
  onResetData,
  onSelectIssue,
  onTabChange
}: AdminDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Action: Delete issue bypass for Admin
  const handleDeleteIssue = async (issueId: string) => {
    setLoading(true);
    try {
      await supabaseSvc.deleteIssue(issueId);
      setSuccessMsg('Issue deleted successfully from the municipal database!');
      await onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action: Force Resolve bypass for Admin
  const handleForceResolve = async (issueId: string) => {
    setLoading(true);
    try {
      await supabaseSvc.updateIssueStatus(issueId, 'resolved', {
        resolved_at: new Date().toISOString(),
        resolution_note: 'Resolved via administrative direct override.'
      });
      setSuccessMsg('Issue marked as Resolved via Admin override!');
      await onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = 4; // Simulated static roles
  const activeIssues = issues.filter(i => i.status !== 'resolved').length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-xs text-green-700 shadow-sm">
          <ShieldCheck size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Admin Diagnostic Bar */}
      <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-orange-600" size={18} />
            <h3 className="font-bold text-gray-800 text-sm font-sans tracking-tight">City Administrative Control Deck</h3>
          </div>
          <p className="text-xs text-gray-500 font-sans">Oversee active field tickets, synchronize live databases, and manage citizen reports globally.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-white hover:bg-gray-50 text-gray-750 font-bold text-xs px-4 py-2.5 rounded-xl border border-gray-250 flex items-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync Database</span>
          </button>

          <button
            onClick={onResetData}
            className="bg-red-55/60 hover:bg-red-50 text-red-650 font-bold text-xs px-4 py-2.5 rounded-xl border border-red-200/50 flex items-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <XOctagon size={13} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Global Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4.5 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Global Database Table</span>
          <div className="text-2xl font-black text-gray-800">{issues.length} Issues</div>
        </div>
        <div className="bg-white border border-gray-200 p-4.5 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Active Street Incidents</span>
          <div className="text-2xl font-black text-orange-600">{activeIssues}</div>
        </div>
        <div className="bg-white border border-gray-200 p-4.5 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Resolved Closures</span>
          <div className="text-2xl font-black text-green-600">{resolvedIssues}</div>
        </div>
        <div className="bg-white border border-gray-200 p-4.5 rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Supabase Sync State</span>
          <div className="text-xs font-bold text-green-600 flex items-center gap-1.5 mt-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Authenticated Connection</span>
          </div>
        </div>
      </div>

      {/* 3. Global Issue Registry Overrides Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Master Street Issue Registry</h4>
          <span className="text-[10px] text-gray-400 font-mono font-bold tracking-wider uppercase">Active Service Register</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-mono uppercase tracking-wider text-[10px] border-b border-gray-200">
                <th className="p-4">Report Details</th>
                <th className="p-4">Department &amp; Category</th>
                <th className="p-4">Assigned Crew</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">No reports found in the system registry database.</td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="p-4 space-y-1">
                      <div className="font-bold text-gray-800">{issue.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono font-semibold">Reporter: {issue.reporter_name}</div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="text-gray-700 font-semibold">{issue.category}</div>
                      <div className="text-[10px] text-orange-600 font-mono font-semibold">{issue.department}</div>
                    </td>

                    <td className="p-4">
                      {issue.assigned_worker_name ? (
                        <div className="text-gray-700 font-medium">{issue.assigned_worker_name}</div>
                      ) : (
                        <span className="text-gray-400 italic">None Allocated</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        issue.status === 'reported' ? 'bg-red-50 text-red-600 border-red-200' :
                        issue.status === 'in_progress' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {issue.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => {
                            onSelectIssue(issue);
                            onTabChange('map');
                          }}
                          className="text-[10px] text-orange-600 hover:text-orange-700 font-semibold bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          View Map
                        </button>

                        {issue.status !== 'resolved' && (
                          <button
                            onClick={() => handleForceResolve(issue.id)}
                            className="text-[10px] text-green-700 hover:text-green-800 font-semibold bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                          >
                            Resolve Now
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="text-[10px] text-red-500 hover:text-red-600 font-semibold bg-white border border-gray-200 p-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
