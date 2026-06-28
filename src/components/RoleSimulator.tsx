import React from 'react';
import { UserRole, Profile } from '../types';
import { MOCK_PROFILES } from '../supabase';
import { Shield, User, Hammer, Building2, HelpCircle } from 'lucide-react';

interface RoleSimulatorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeProfile: Profile;
}

export default function RoleSimulator({ currentRole, onRoleChange, activeProfile }: RoleSimulatorProps) {
  const roleMetadata: Record<UserRole, { label: string; desc: string; color: string; icon: any }> = {
    public: {
      label: 'Public Citizen',
      desc: 'Reports issues, validates, upvotes, tracks personal impact points & hero ranks.',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: User
    },
    worker: {
      label: 'Maintenance Worker',
      desc: 'Inspects assigned work checklists, updates progress, and uploads resolution proof.',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: Hammer
    },
    department: {
      label: 'Department Dispatcher',
      desc: 'Reviews reports, accepts AI categorization suggestions, and dispatches workers.',
      color: 'bg-red-50 text-red-600 border-red-200',
      icon: Building2
    },
    admin: {
      label: 'City Administrator',
      desc: 'Secures system, verifies Supabase RLS schema compliance, and views general audit logs.',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: Shield
    }
  };

  const Meta = roleMetadata[currentRole];

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Current simulated profile */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50 rounded-lg text-orange-600 border border-gray-200">
            <Meta.icon size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Active Identity</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${Meta.color}`}>
                {Meta.label}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
              {activeProfile.full_name} 
              <span className="text-xs text-gray-500 font-medium">({activeProfile.email})</span>
            </h4>
          </div>
        </div>

        {/* Center/Right: Role selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1 hidden lg:inline">Simulation Switcher:</span>
          {(Object.keys(MOCK_PROFILES) as UserRole[]).map((role) => {
            const roleMeta = roleMetadata[role];
            const isSelected = currentRole === role;
            const Icon = roleMeta.icon;

            return (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={14} />
                <span>{roleMeta.label.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-2 text-[11px] text-gray-500 border-t border-gray-150 pt-2 flex items-center gap-1">
        <HelpCircle size={12} className="text-orange-500" />
        <span><strong>Role Context:</strong> {Meta.desc}</span>
      </div>
    </div>
  );
}
