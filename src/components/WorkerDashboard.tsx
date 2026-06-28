import React, { useState } from 'react';
import { Issue, Profile } from '../types';
import { 
  Hammer, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  ChevronRight,
  ClipboardList,
  Camera,
  ThumbsUp
} from 'lucide-react';

interface WorkerDashboardProps {
  issues: Issue[];
  activeProfile: Profile;
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  onResolveIssueSubmit: (e: React.FormEvent, issueId: string, note: string, img: string) => Promise<void>;
}

export default function WorkerDashboard({
  issues,
  activeProfile,
  selectedIssue,
  onSelectIssue,
  onResolveIssueSubmit
}: WorkerDashboardProps) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImg, setResolutionImg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter tasks assigned to this worker
  const myTasks = issues.filter(i => i.assigned_worker_id === activeProfile.id);
  const pendingTasks = myTasks.filter(i => i.status !== 'resolved');
  const completedTasks = myTasks.filter(i => i.status === 'resolved');

  // Submit repair logs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !resolutionNote) return;

    setIsSubmitting(true);
    try {
      const imgFallback = resolutionImg || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80';
      await onResolveIssueSubmit(e, selectedIssue.id, resolutionNote, imgFallback);
      setSuccessMsg(`Task "${selectedIssue.title}" resolved successfully!`);
      setResolutionNote('');
      setResolutionImg('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPreFillPhoto = (url: string) => {
    setResolutionImg(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 1. Worker Workload List Column */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="text-orange-500" size={18} />
              <h3 className="font-bold text-gray-800 text-sm">Assigned Tasks ({pendingTasks.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 font-bold">
              Active Crew
            </span>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {myTasks.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 italic">No tasks currently assigned. Go to the "Dispatcher" panel to assign tasks to Marcus Vance!</p>
              </div>
            ) : (
              <>
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelectIssue(task)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer block space-y-2 group ${
                      selectedIssue?.id === task.id
                        ? 'bg-orange-50 border-orange-200 text-orange-950'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-150 text-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] font-mono uppercase bg-white border border-gray-200 px-2 py-0.5 rounded text-orange-600 font-bold">
                        {task.category}
                      </span>
                      <span className="text-[9px] text-red-500 font-mono flex items-center gap-1 font-bold">
                        <span className="h-1 w-1 bg-red-500 rounded-full animate-pulse" />
                        PENDING
                      </span>
                    </div>

                    <h4 className="text-xs font-bold leading-relaxed text-gray-850 group-hover:text-orange-600 transition-colors">
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <MapPin size={11} className="text-gray-400" />
                      <span className="truncate">Lat: {task.latitude.toFixed(4)}, Lng: {task.longitude.toFixed(4)}</span>
                    </div>
                  </button>
                ))}

                {completedTasks.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block mb-2">Completed Tasks</span>
                    <div className="space-y-2">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 border border-gray-150 p-3 rounded-xl flex items-center justify-between text-xs shadow-sm"
                        >
                          <div className="truncate max-w-[180px]">
                            <h5 className="font-bold text-gray-700 truncate">{task.title}</h5>
                            <span className="text-[9px] text-gray-400 font-mono">{task.category}</span>
                          </div>
                          <span className="text-[9px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            ✓ FIXED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Repair Logging Details Console */}
      <div className="lg:col-span-8 space-y-4">
        {successMsg && (
          <div className="bg-green-50 border border-green-250 p-4 rounded-xl flex items-center gap-3 text-xs text-green-700">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {selectedIssue && selectedIssue.assigned_worker_id === activeProfile.id && selectedIssue.status !== 'resolved' ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
            {/* Header Description */}
            <div className="border-b border-gray-200 pb-4 space-y-1.5">
              <span className="text-[9px] font-mono tracking-widest text-orange-600 font-bold uppercase">Active Task Detail Card</span>
              <h3 className="text-base font-bold text-gray-800">"{selectedIssue.title}"</h3>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-150 mt-2">
                {selectedIssue.description}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Resolution Field Notes</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="State specifically how the community issue was addressed (e.g., cleared rubble from the pothole, filled with high-grade hot asphalt tarmac mix, and compacted the seal)..."
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Proof of Resolution Image</label>
                <input
                  type="text"
                  value={resolutionImg}
                  onChange={(e) => setResolutionImg(e.target.value)}
                  placeholder="Paste URL of the resolved repair, or pick a high-fidelity template below"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />

                {/* Simulated Camera Pre-fills */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Completed photo presets:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => selectPreFillPhoto('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80')}
                      className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left text-[10px] flex items-center gap-2 text-gray-500 hover:text-gray-800 cursor-pointer transition-all"
                    >
                      <Camera size={12} className="text-orange-500" />
                      <span>Road Repaved / Tarmac Filled</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPreFillPhoto('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80')}
                      className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left text-[10px] flex items-center gap-2 text-gray-500 hover:text-gray-800 cursor-pointer transition-all"
                    >
                      <Camera size={12} className="text-orange-500" />
                      <span>Sanitation / Area Cleaned</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end pt-2 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10 transition-all disabled:opacity-50"
                >
                  <Hammer size={14} className={isSubmitting ? 'animate-spin' : ''} />
                  <span>{isSubmitting ? 'Submitting Resolution Logs...' : 'Submit Work Log & Resolve'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-xs text-gray-400 italic h-[340px] flex flex-col items-center justify-center space-y-3 shadow-sm">
            <div className="h-10 w-10 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center">
              <Hammer className="text-gray-400" size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-700">No Repair Target Selected</h4>
              <p className="text-[11px] text-gray-500 max-w-sm">Select an active job from your assigned workload queue on the left to review instructions and post photos of the completed resolution.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
