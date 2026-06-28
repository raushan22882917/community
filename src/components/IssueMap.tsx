import React, { useState } from 'react';
import { Issue, UserRole, Profile } from '../types';
import { MapPin, ThumbsUp, MessageSquare, AlertCircle, CheckCircle2, ShieldCheck, Filter, Clock } from 'lucide-react';

interface IssueMapProps {
  issues: Issue[];
  currentRole: UserRole;
  activeProfile: Profile;
  onUpvote: (id: string) => void;
  onVerify: (id: string, status: 'verified' | 'disputed', note: string) => void;
  onSelectIssue: (issue: Issue) => void;
  selectedIssue: Issue | null;
}

export default function IssueMap({
  issues,
  currentRole,
  activeProfile,
  onUpvote,
  onVerify,
  onSelectIssue,
  selectedIssue
}: IssueMapProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [verificationNote, setVerificationNote] = useState<string>('');

  // Define unique map areas representing our hyperlocal district
  const neighborhoods = [
    { name: 'Downtown Core', x: '10%', y: '10%', w: '40%', h: '40%', color: 'border-gray-300 bg-gray-100/30' },
    { name: 'Hill District', x: '50%', y: '10%', w: '40%', h: '35%', color: 'border-gray-300 bg-gray-100/30' },
    { name: 'Creek Park Area', x: '10%', y: '50%', w: '45%', h: '40%', color: 'border-green-250 bg-green-50/20' },
    { name: 'Industrial Belt', x: '55%', y: '45%', w: '35%', h: '45%', color: 'border-gray-300 bg-gray-100/30' }
  ];

  // Map latitude & longitude to SVG % coordinates
  // SF Bounds approx: Lat 37.75 - 37.79, Lng -122.45 - -122.41
  const convertCoords = (lat: number, lng: number) => {
    const latMin = 37.75;
    const latMax = 37.79;
    const lngMin = -122.45;
    const lngMax = -122.41;

    // Map to percentage of the 100x100 grid
    let x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    let y = 100 - ((lat - latMin) / (latMax - latMin)) * 100; // Invert y because SVG starts from top

    // Constrain inside bounds
    x = Math.max(10, Math.min(90, x));
    y = Math.max(10, Math.min(90, y));

    return { x: `${x}%`, y: `${y}%` };
  };

  const categories = ['All', 'Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Management', 'Infrastructure'];
  const statuses = ['All', 'reported', 'validated', 'in_progress', 'resolved'];

  // Filter issues based on select parameters
  const filteredIssues = issues.filter(issue => {
    const matchCat = filterCategory === 'All' || issue.category === filterCategory;
    const matchStat = filterStatus === 'All' || issue.status === filterStatus;
    return matchCat && matchStat;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'reported': return { bg: 'bg-red-50 text-red-600 border-red-200', glow: 'bg-red-500 shadow-red-500/50' };
      case 'validated': return { bg: 'bg-orange-50 text-orange-600 border-orange-200', glow: 'bg-orange-500 shadow-orange-500/50' };
      case 'in_progress': return { bg: 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse', glow: 'bg-orange-500 shadow-orange-500/50' };
      case 'resolved': return { bg: 'bg-green-50 text-green-700 border-green-200', glow: 'bg-green-500 shadow-green-500/50' };
      default: return { bg: 'bg-gray-100 text-gray-500 border-gray-200', glow: 'bg-gray-400' };
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Pothole': return 'text-gray-500';
      case 'Water Leakage': return 'text-orange-500';
      case 'Damaged Streetlight': return 'text-orange-400';
      case 'Waste Management': return 'text-green-600';
      default: return 'text-red-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Filters & Map Display */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* Map Header Controls */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Map Filter</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Select */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white text-gray-700 text-xs border border-gray-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-orange-500 shadow-sm font-semibold"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
            {/* Status Select */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white text-gray-700 text-xs border border-gray-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-orange-500 shadow-sm font-semibold"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* The Vector GIS Grid Map */}
        <div className="relative bg-gray-50 border border-gray-200 rounded-2xl aspect-[4/3] overflow-hidden shadow-inner flex-1 min-h-[400px]">
          {/* Cyber grid overlay lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70" />

          {/* Neighborhood borders */}
          {neighborhoods.map((district) => (
            <div
              key={district.name}
              className={`absolute border border-dashed rounded-lg flex items-center justify-center p-2 select-none ${district.color}`}
              style={{ left: district.x, top: district.y, width: district.w, height: district.h }}
            >
              <span className="text-[10px] font-mono tracking-wider uppercase text-gray-400 font-bold">
                {district.name}
              </span>
            </div>
          ))}

          {/* Compass / Scale */}
          <div className="absolute bottom-4 left-4 p-2 bg-white/85 backdrop-blur-md rounded border border-gray-200 pointer-events-none text-[9px] font-mono text-gray-500 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-orange-500">✦</span>
              <span>GRID GIS: HYPERLOCAL v1.2</span>
            </div>
            <div>SCALE: 1 BLOCK = 50m</div>
          </div>

          {/* Render glowing Coordinate Pins */}
          {filteredIssues.map((issue) => {
            const { x, y } = convertCoords(issue.latitude, issue.longitude);
            const statusStyle = getStatusStyle(issue.status);
            const isSelected = selectedIssue?.id === issue.id;

            return (
              <button
                key={issue.id}
                onClick={() => {
                  onSelectIssue(issue);
                  setVerificationNote('');
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 group transition-all duration-300 cursor-pointer z-20`}
                style={{ left: x, top: y }}
              >
                {/* Ping Pulse */}
                <span className={`absolute inset-0 rounded-full scale-[1.8] opacity-15 animate-ping ${statusStyle.glow}`} />
                <span className={`absolute inset-0 rounded-full scale-[2.5] opacity-5 group-hover:opacity-20 transition-opacity ${statusStyle.glow}`} />

                {/* Glowing Core Pin */}
                <div className={`p-1.5 rounded-full border shadow-md transition-transform duration-200 ${
                  isSelected 
                    ? 'bg-orange-600 border-white text-white scale-125 z-30 shadow-lg' 
                    : 'bg-white hover:scale-115 border-gray-350 text-gray-800'
                }`}>
                  <MapPin size={15} className={isSelected ? 'text-white' : getCategoryColor(issue.category)} />
                </div>

                {/* Micro Hover Label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none transition-all duration-200">
                  {issue.title.slice(0, 20)}...
                </div>
              </button>
            );
          })}

          {filteredIssues.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white/90">
              <AlertCircle size={24} className="text-gray-400 mb-2" />
              <h4 className="text-xs font-bold text-gray-700">No reported problems matched</h4>
              <p className="text-[11px] text-gray-400 mt-1">Try resetting the filters above to see all reports.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Problem Sidebar Information Panel */}
      <div className="lg:col-span-4 flex flex-col">
        {selectedIssue ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm h-full">
            {/* Visual Header */}
            {selectedIssue.image_url ? (
              <div className="relative h-44 w-full bg-gray-100 overflow-hidden border-b border-gray-100">
                <img
                  src={selectedIssue.image_url}
                  alt={selectedIssue.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusStyle(selectedIssue.status).bg}`}>
                  {selectedIssue.status.toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative flex items-end border-b border-gray-150">
                <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusStyle(selectedIssue.status).bg}`}>
                  {selectedIssue.status.toUpperCase()}
                </span>
              </div>
            )}

            {/* Title & Body */}
            <div className="p-5 flex-1 space-y-4 max-h-[420px] overflow-y-auto">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-orange-600 font-bold uppercase block">{selectedIssue.category}</span>
                <h3 className="font-bold text-gray-800 text-sm mt-1">{selectedIssue.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                  <Clock size={12} className="text-gray-400" />
                  <span>Reported by <strong className="text-gray-700">{selectedIssue.reporter_name}</strong></span>
                </div>
              </div>

              <p className="text-xs text-gray-650 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                {selectedIssue.description}
              </p>

              {/* Resolution proof details if resolved */}
              {selectedIssue.status === 'resolved' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={15} />
                    <span className="text-xs font-bold uppercase tracking-wider">Resolution Verified</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed font-medium">
                    "{selectedIssue.resolution_note || 'The assigned task has been successfully fixed and cleared.'}"
                  </p>
                  {selectedIssue.resolution_image && (
                    <div className="h-24 rounded bg-gray-50 overflow-hidden mt-1 border border-green-200">
                      <img 
                        src={selectedIssue.resolution_image} 
                        alt="Resolution proof" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Worker Assignment Details */}
              {selectedIssue.assigned_worker_name && (
                <div className="flex items-center gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-600 shadow-sm font-semibold">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <span>Assigned Worker: <strong className="text-gray-800">{selectedIssue.assigned_worker_name}</strong></span>
                </div>
              )}

              {/* Actions & Gamified upvotes */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => onUpvote(selectedIssue.id)}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 transition-colors cursor-pointer group shadow-sm"
                >
                  <ThumbsUp size={14} className="text-orange-600 group-hover:scale-110 transition-transform" />
                  <span>Upvote ({selectedIssue.upvotes})</span>
                </button>
                <div className="text-xs text-gray-500 font-semibold">
                  GPS: <span className="font-mono text-gray-650">{selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}</span>
                </div>
              </div>

              {/* Community Verification Input Form (Only for Public citizen, and only if not resolved yet) */}
              {currentRole === 'public' && selectedIssue.status !== 'resolved' && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-orange-600" />
                    <span>Verify this problem</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Are you on-site? Confirm details to help city departments prioritize this. <strong>Get +5 Hero Points!</strong>
                  </p>

                  <textarea
                    rows={2}
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Provide current on-site description or status proof..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onVerify(selectedIssue.id, 'verified', verificationNote);
                        setVerificationNote('');
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-all"
                    >
                      ✓ Confirm Problem
                    </button>
                    <button
                      onClick={() => {
                        onVerify(selectedIssue.id, 'disputed', verificationNote);
                        setVerificationNote('');
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-all"
                    >
                      ✗ Dispute Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[300px]">
            <MapPin size={32} className="text-gray-350 animate-bounce mb-3" />
            <h4 className="text-sm font-bold text-gray-700">No issue selected</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
              Select any glowing coordinate pin on the map grid to inspect report metrics and verified actions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
