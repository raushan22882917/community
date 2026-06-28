import React, { useState } from 'react';
import { Issue, Profile } from '../types';
import { 
  Building2, 
  User, 
  MapPin, 
  Compass, 
  Plus, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Brain,
  Truck
} from 'lucide-react';

interface DispatcherDashboardProps {
  issues: Issue[];
  activeProfile: Profile;
  onAssignWorker: (issueId: string) => Promise<void>;
  onSelectIssue: (issue: Issue) => void;
  onTabChange: (tab: 'map' | 'dashboard' | 'insights' | 'database') => void;
}

const DEPARTMENTS = [
  'Roads',
  'Water & Sewage',
  'Electricity',
  'Sanitation',
  'Public Infrastructure'
];

export default function DispatcherDashboard({
  issues,
  activeProfile,
  onAssignWorker,
  onSelectIssue,
  onTabChange
}: DispatcherDashboardProps) {
  // Local active department filter state
  const [selectedDept, setSelectedDept] = useState<string>('Roads');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Filter issues belonging to the selected department
  const filteredIssues = issues.filter(i => i.department === selectedDept);
  const unassignedIssues = filteredIssues.filter(i => i.status === 'reported' || i.status === 'validated');
  const activeDispatches = filteredIssues.filter(i => i.status === 'in_progress');
  const completedFixes = filteredIssues.filter(i => i.status === 'resolved');

  const handleAssignClick = async (issueId: string) => {
    setAssigningId(issueId);
    try {
      await onAssignWorker(issueId);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Department Selector Tabs */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Department Dispatch Controller</h3>
          <p className="text-xs text-gray-500 mt-1">Switch departments below to audit active queues, assign repair crews, and analyze area metrics.</p>
        </div>

        {/* Picker */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-150">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                selectedDept === dept
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dispatch Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Unassigned Reports</span>
          <div className="text-2xl font-black text-red-600 mt-1">{unassignedIssues.length}</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Active Dispatches</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{activeDispatches.length}</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Completed Fixes</span>
          <div className="text-2xl font-black text-green-600 mt-1">{completedFixes.length}</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Service SLA Score</span>
            <div className="text-lg font-bold text-green-600 mt-1">94.8% Optimal</div>
          </div>
          <Sparkles className="text-orange-500" size={18} />
        </div>
      </div>

      {/* 3. Primary Queues Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unassigned Dispatch Tasks */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Pending Job Dispatch Queue</h4>
            <span className="text-[9px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold">
              Awaiting Allocation
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {unassignedIssues.length === 0 ? (
              <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 italic">No pending reports for the "{selectedDept}" department. Switch departments or file test issues as a Public Citizen!</p>
              </div>
            ) : (
              unassignedIssues.map((issue) => (
                <div key={issue.id} className="bg-white border border-gray-150 p-4 rounded-xl space-y-3 relative group hover:border-gray-350 transition-all shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                        {issue.category}
                      </span>
                      <h4 className="font-bold text-xs text-gray-800 mt-1.5">{issue.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 italic leading-relaxed">
                        "{issue.description}"
                      </p>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 border uppercase ${
                      issue.status === 'validated' 
                        ? 'bg-orange-50 text-orange-600 border-orange-200' 
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-150 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400" />
                      <span>SF Central District</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectIssue(issue);
                          onTabChange('map');
                        }}
                        className="text-[10px] text-orange-600 hover:text-orange-700 font-semibold bg-white border border-gray-200 px-2.5 py-1 rounded cursor-pointer transition-colors"
                      >
                        Map Target
                      </button>

                      <button
                        onClick={() => handleAssignClick(issue.id)}
                        disabled={assigningId === issue.id}
                        className="text-[10px] bg-orange-600 hover:bg-orange-500 disabled:bg-gray-100 text-white font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer shadow-sm shadow-orange-600/10 transition-colors"
                      >
                        <Truck size={11} className={assigningId === issue.id ? 'animate-bounce' : ''} />
                        <span>{assigningId === issue.id ? 'Dispatching...' : 'Dispatch Crew'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Dispatches & Crew Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Active Street Operations ({activeDispatches.length})</h4>

            <div className="space-y-3">
              {activeDispatches.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 italic">No active street repairs currently in progress for "{selectedDept}".</p>
                </div>
              ) : (
                activeDispatches.map((disp) => (
                  <div key={disp.id} className="bg-white p-3.5 rounded-xl border border-gray-150 flex items-start gap-3 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0 mt-1.5 animate-ping" />
                    <div className="space-y-1.5 flex-1">
                      <h5 className="text-xs font-bold text-gray-800 truncate">{disp.title}</h5>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <User size={11} className="text-orange-500" />
                        <span>Crew: <strong>{disp.assigned_worker_name || 'Marcus Vance'}</strong></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Predictive Smart Dispatch recommendation widget */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-orange-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">AI Dispatch Recommendations</h4>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-150">
              Our <strong>Gemini AI model</strong> analysis advises preemptively dispatching water/sanitation crews to lower central districts before high-pressure peak usage cycles. Run a full trend audit on the <span className="text-orange-600 font-semibold cursor-pointer" onClick={() => onTabChange('insights')}>Predictive Insights</span> tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
