import React from 'react';
import { Issue, Profile, LeaderboardUser } from '../types';
import { Award, TrendingUp, CheckCircle2, ShieldAlert, BarChart3, Users, Landmark, Zap } from 'lucide-react';

interface ImpactDashboardProps {
  issues: Issue[];
  activeProfile: Profile;
}

export default function ImpactDashboard({ issues, activeProfile }: ImpactDashboardProps) {
  // Generate mock leaderboard users
  const leaderboard: LeaderboardUser[] = [
    { id: 'l-1', full_name: 'Elena Rostova', points: 380, reports_count: 14, verifications_count: 24, rank: 1 },
    { id: 'l-2', full_name: 'Cassandra Gray', points: 290, reports_count: 10, verifications_count: 18, rank: 2 },
    { id: 'l-3', full_name: 'Alex Mercer', points: 215, reports_count: 8, verifications_count: 11, rank: 3 },
    { id: 'l-4', full_name: 'Yuki Sato', points: 180, reports_count: 5, verifications_count: 16, rank: 4 },
    { id: 'l-5', full_name: 'Marcus Vance', points: 150, reports_count: 4, verifications_count: 10, rank: 5 }
  ];

  // If active user is "public", render their personalized gamification stats
  const reportsCount = issues.filter(i => i.reporter_id === activeProfile.id).length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const validatedCount = issues.filter(i => i.status === 'validated').length;
  const reportedCount = issues.filter(i => i.status === 'reported').length;

  const resolutionRate = issues.length > 0 ? Math.round((resolvedCount / issues.length) * 100) : 0;

  // Category counts for custom SVG bar charts
  const categories = ['Pothole', 'Water Leakage', 'Damaged Streetlight', 'Waste Management', 'Infrastructure'];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = issues.filter(i => i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  // Get Hero Tier
  const getHeroTier = (pts: number) => {
    if (pts >= 400) return { title: 'Platinum Savior', color: 'text-green-700 border-green-200 bg-green-50' };
    if (pts >= 250) return { title: 'Gold Guardian', color: 'text-orange-600 border-orange-200 bg-orange-50' };
    if (pts >= 100) return { title: 'Silver Watcher', color: 'text-red-600 border-red-250 bg-red-50' };
    return { title: 'Bronze Patrolman', color: 'text-gray-600 border-gray-200 bg-gray-50' };
  };

  const currentTier = getHeroTier(activeProfile.points);

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personal / System Points */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
            <Award size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Citizen Hero Score</h5>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-gray-800">{activeProfile.points}</span>
              <span className="text-[10px] font-mono text-orange-600 font-bold">PTS</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Ranked tier: {currentTier.title}</p>
          </div>
        </div>

        {/* Resolved Problems */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg border border-green-100">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resolved Issues</h5>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-gray-800">{resolvedCount}</span>
              <span className="text-[10px] text-gray-500">/ {issues.length} total</span>
            </div>
            <p className="text-[10px] text-green-600 font-bold">{resolutionRate}% resolution index</p>
          </div>
        </div>

        {/* Dispatch Backlogs */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
            <Zap size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active In-Progress</h5>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-gray-800">{inProgressCount}</span>
              <span className="text-[10px] text-gray-500 font-medium">delegated jobs</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{reportedCount + validatedCount} pending dispatch</p>
          </div>
        </div>

        {/* Total Active Reports */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Reports</h5>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-gray-800">{issues.length}</span>
              <span className="text-[10px] text-gray-500">neighborhood reports</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">4 local sectors audited</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Analytics & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (Custom SVG chart) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-orange-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Issues by Category Distribution</h4>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="space-y-4 pt-2">
              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const percentage = Math.round((count / maxCount) * 100);

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">{cat}</span>
                      <span className="font-mono text-gray-500 font-bold">{count} reports</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-150 text-xs text-gray-500 flex items-center gap-2 font-medium">
            <Landmark size={14} className="text-orange-600" />
            <span>Public Sanitation and Roads make up the largest municipal resource strain currently.</span>
          </div>
        </div>

        {/* Citizen Leaderboard */}
        <div className="lg:col-span-5 bg-white border border-gray-200 p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-orange-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Community Hero Leaderboard</h4>
            </div>

            <div className="space-y-3.5">
              {leaderboard.map((user) => {
                const isCurrentUser = user.id === activeProfile.id;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isCurrentUser 
                        ? 'bg-orange-50 border-orange-200 text-orange-950 shadow-sm' 
                        : 'bg-gray-50 border-gray-150 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${
                        user.rank === 1 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        user.rank === 2 ? 'bg-gray-200 text-gray-700 border border-gray-300' :
                        'bg-gray-100 text-gray-500 border border-gray-250'
                      }`}>
                        {user.rank}
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-gray-800">{user.full_name}</span>
                        <span className="text-[10px] text-gray-500">{user.reports_count} reports • {user.verifications_count} verified</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-orange-600">{user.points}</span>
                      <span className="text-[9px] text-gray-400 font-bold block">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-gray-400 font-bold leading-relaxed text-center italic">
            Participate on site to level up. Top weekly heroes earn customized digital municipal badges!
          </div>
        </div>
      </div>
    </div>
  );
}
