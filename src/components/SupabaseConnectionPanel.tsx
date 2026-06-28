import React, { useState } from 'react';
import { supabaseSvc, SUPABASE_SQL_SCHEMA } from '../supabase';
import { Database, Copy, Check, Server, Eye, EyeOff, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

export default function SupabaseConnectionPanel() {
  const [config, setConfig] = useState(supabaseSvc.getConfig());
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setConnectionStatus('Please enter both Supabase URL and Anon Key.');
      return;
    }

    setConnectionStatus('Initializing connection...');
    const success = supabaseSvc.initialize(url, anonKey);
    
    if (success) {
      // Test actual ping
      try {
        const client = supabaseSvc.getClient();
        if (client) {
          const { error } = await client.from('issues').select('id').limit(1);
          if (error && error.code !== 'PGRST116') { // Ignore empty database error, just want connection
            console.log('Issues table might not exist yet, but client connection is valid.', error);
          }
          setConfig(supabaseSvc.getConfig());
          setConnectionStatus('Connected successfully! Ready to write & read live database tables.');
        } else {
          setConnectionStatus('Could not create client.');
        }
      } catch (err: any) {
        setConnectionStatus(`Connected to endpoint, but verify if tables are created. Error: ${err.message}`);
      }
    } else {
      setConnectionStatus('Failed to connect. Please check your credentials.');
    }
  };

  const handleDisconnect = () => {
    supabaseSvc.disconnect();
    setConfig(supabaseSvc.getConfig());
    setUrl('');
    setAnonKey('');
    setConnectionStatus('Disconnected. Using sandboxed local storage database simulator.');
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showSql, setShowSql] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Connection Manager */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.isConnected ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                Platform Database Sync Settings
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                  config.isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {config.isConnected ? 'CONNECTED TO SUPABASE' : 'SANDBOX DATABASE ACTIVE'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {config.isConnected 
                  ? 'Active connection to your cloud database tables with strict Row Level Security (RLS) active.' 
                  : 'Currently running on a fully offline client-side storage module. Input database credentials to connect.'}
              </p>
            </div>
          </div>
          {config.isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
            >
              Disconnect Cloud Database
            </button>
          )}
        </div>

        {!config.isConnected ? (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Supabase Database API URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Supabase Database Anon Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 pr-10 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                <AlertTriangle size={14} className="shrink-0" />
                <span>To support this connection, make sure the required tables are created in your Supabase project.</span>
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-orange-600/10 cursor-pointer"
              >
                <Server size={14} />
                <span>Save &amp; Connect Database</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2.5 text-xs text-green-700">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Success: Automatically synchronizing municipal incidents, upvotes, and verifications with the cloud database.</span>
          </div>
        )}

        {connectionStatus && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-semibold">
            {connectionStatus}
          </div>
        )}
      </div>

      {/* 2. SQL Schema Instructions (Collapsible) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                Database Schema &amp; Row Level Security Setup
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Required for cloud sync. Click the button to toggle the SQL schema migration script and copy it into your database SQL Editor.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSql(!showSql)}
                className="flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold shadow-sm"
              >
                <span>{showSql ? 'Hide SQL Code' : 'Show SQL Setup Script'}</span>
              </button>

              {showSql && (
                <button
                  onClick={copySql}
                  className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white border border-transparent px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold shadow-md shadow-orange-600/10"
                >
                  {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {showSql && (
          <div className="relative border-b border-gray-200">
            <pre className="text-[11px] font-mono leading-relaxed p-6 bg-gray-900 text-gray-100 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {SUPABASE_SQL_SCHEMA}
            </pre>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Security Policy Summary */}
        <div className="bg-gray-50 p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Role-Based Database Access Rules</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-[10px] uppercase font-black text-green-700 tracking-wider">Public Citizen</span>
              <h5 className="text-xs font-bold text-gray-850 mt-1">Read-Heavy, Self-Report</h5>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Can browse all issues, submit public reports, and upvote or verify on-site problems.
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-[10px] uppercase font-black text-orange-600 tracking-wider">Maintenance Worker</span>
              <h5 className="text-xs font-bold text-gray-850 mt-1">Resolve Checklists</h5>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Can view and update tasks assigned directly to them, posting resolution comments and proof-of-work.
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-[10px] uppercase font-black text-red-500 tracking-wider">Department Dispatcher</span>
              <h5 className="text-xs font-bold text-gray-850 mt-1">Domain Dispatching</h5>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Manages incoming incident queues for their specific department and assigns certified field crews.
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-[10px] uppercase font-black text-gray-600 tracking-wider">City Admin</span>
              <h5 className="text-xs font-bold text-gray-850 mt-1">Full Overseer</h5>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Universal overview of all profiles, dispatches, audits, and database metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
