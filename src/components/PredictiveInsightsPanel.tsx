import React, { useState, useEffect } from 'react';
import { Issue } from '../types';
import { BrainCircuit, AlertCircle, RefreshCw, BarChart2, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';

interface PredictiveInsightsPanelProps {
  issues: Issue[];
}

interface Hotspot {
  area: string;
  category: string;
  riskIndex: number;
  reason: string;
}

interface InsightsData {
  hotspots: Hotspot[];
  recommendations: string[];
  citizen_engagement_score: string;
  ai_analysis: string;
  isMock: boolean;
}

export default function PredictiveInsightsPanel({ issues }: PredictiveInsightsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/predictive-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues })
      });

      if (!res.ok) {
        throw new Error('Failed to compute predictive insights.');
      }

      const data = await res.json();
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error computing municipal trends.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch initial insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Explanation Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <BrainCircuit size={18} className="text-orange-600" />
            <span>AI Predictive Dispatch &amp; Urban Hotspots</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Municipal planners use predictive analysis to allocate sanitation, electricity, and water &amp; sewage crews pre-emptively based on report frequency, localized pipe age, and traffic wearing factors.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-150 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Analyzing Trends...' : 'Audit Grid Analytics'}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-250 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="h-10 w-10 border-4 border-t-orange-600 border-gray-200 rounded-full animate-spin" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-700">Evaluating Local Infrastructure Strain</h4>
            <p className="text-[11px] text-gray-500 max-w-md">
              Evaluating clustering coefficients across {issues.length} active reported problems. Analyzing category frequency against sewer &amp; electrical networks...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-xs font-bold text-red-600">Analysis Halted</h4>
            <p className="text-[11px] text-gray-650 mt-1">{error}</p>
          </div>
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Hotspots Slider & Risk List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sliders size={16} className="text-orange-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Cluster Hotspots &amp; Risk Indices</h4>
              </div>

              <div className="space-y-4">
                {insights.hotspots.map((hot, i) => (
                  <div key={i} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800">{hot.area}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        hot.riskIndex >= 75 ? 'bg-red-50 text-red-600 border-red-200' :
                        hot.riskIndex >= 50 ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        RISK INDEX: {hot.riskIndex}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Category: <strong className="text-gray-700">{hot.category}</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      "{hot.reason}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Recommendations & AI Trend Summary */}
          <div className="lg:col-span-6 space-y-4">
            {/* Recommendations */}
            <div className="bg-white border border-gray-200 p-5 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Active Strategic Dispatches</h4>
              </div>

              <div className="space-y-2.5">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <input
                      type="checkbox"
                      defaultChecked={i === 0}
                      className="mt-1 accent-orange-600 rounded border-gray-300 cursor-pointer h-3.5 w-3.5"
                    />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Deep Analysis Paragraph */}
            <div className="bg-white border border-gray-200 p-5 rounded-xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-orange-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">AI Predictive Summary</h4>
                </div>
                <div className="text-[10px] font-mono text-gray-400 font-bold">
                  {insights.isMock ? 'SIMULATED DATA' : 'REAL TIME GEMINI'}
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                {insights.ai_analysis}
              </p>

              <div className="flex items-center justify-between pt-1.5 text-[11px] text-gray-500">
                <span>Citizen engagement index:</span>
                <span className="font-bold text-green-600">{insights.citizen_engagement_score}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
