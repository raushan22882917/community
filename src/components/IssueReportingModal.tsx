import React, { useState } from 'react';
import { UserRole, Profile, Issue } from '../types';
import { AlertCircle, Image as ImageIcon, MapPin, Sparkles, X, PlusCircle } from 'lucide-react';

interface IssueReportingModalProps {
  onClose: () => void;
  onSubmit: (issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'upvotes'>) => void;
  activeProfile: Profile;
}

// Preset high-fidelity problem templates to make testing beautiful & instantaneous
const IMAGE_TEMPLATES = [
  { label: 'Pothole Tarmac', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Water Burst', url: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Trash Pile', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dark Lamp', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80' }
];

export default function IssueReportingModal({ onClose, onSubmit, activeProfile }: IssueReportingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [department, setDepartment] = useState('Public Infrastructure');
  const [imageUrl, setImageUrl] = useState('');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [priority, setPriority] = useState('Medium');
  const [aiSummary, setAiSummary] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger server-side Gemini AI categorization
  const handleAiAutoFill = async () => {
    if (!title || !description) {
      setError('Please write a Title and Description first so Gemini can analyze it.');
      return;
    }

    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categorize-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        throw new Error('AI analysis service did not respond.');
      }

      const data = await res.json();
      
      // Auto-populate states returned by Gemini
      setCategory(data.category);
      setDepartment(data.department);
      setPriority(data.priority);
      setAiSummary(data.ai_summary);
    } catch (err: any) {
      console.error(err);
      setError('Failed to trigger AI Smart Autofill. Please fill categories manually.');
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch real HTML5 Geolocation, or simulate within map bounds
  const handleGetLocation = () => {
    setGpsLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation denied or failed, generating random district coordinate.', err);
          // Seed near center San Francisco
          const latOffset = (Math.random() - 0.5) * 0.03;
          const lngOffset = (Math.random() - 0.5) * 0.03;
          setLatitude(37.7749 + latOffset);
          setLongitude(-122.4194 + lngOffset);
          setGpsLoading(false);
        }
      );
    } else {
      setGpsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required to submit a public report.');
      return;
    }

    onSubmit({
      title,
      description: aiSummary ? `${description}\n\n[AI System Dispatch Summary: ${aiSummary}]` : description,
      category,
      status: 'reported',
      latitude,
      longitude,
      reporter_id: activeProfile.id,
      reporter_name: activeProfile.full_name,
      department,
      image_url: imageUrl || IMAGE_TEMPLATES[0].url // Fallback to avoid empty image UI
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-orange-600" size={20} />
            <h3 className="font-bold text-gray-800 text-base">Report Hyperlocal Community Issue</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-red-600 shadow-sm font-semibold">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Problem Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sinking asphalt near central drain"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-orange-500 placeholder-gray-400 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Issue Description</label>
                
                {/* AI autofill trigger */}
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-700 font-black px-2.5 py-1 rounded border border-orange-200 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                >
                  <Sparkles size={11} className={aiLoading ? 'animate-spin' : ''} />
                  <span>{aiLoading ? 'AI Categorizing...' : 'AI Smart Autofill'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue. Include dimensions, severity, safety impact, and landmark cues..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-orange-500 placeholder-gray-400 leading-relaxed font-medium"
              />
            </div>
          </div>

          {/* AI Output preview */}
          {aiSummary && (
            <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-lg space-y-1 shadow-sm">
              <span className="text-[9px] font-mono tracking-widest text-orange-700 font-bold uppercase block">Gemini AI Dispatch Recommendation</span>
              <p className="text-xs text-orange-950 font-medium italic">
                "{aiSummary}"
              </p>
            </div>
          )}

          {/* Coordinates & Categorization Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-700 focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="Pothole">Pothole</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Damaged Streetlight">Damaged Streetlight</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            {/* Department Match */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-700 focus:outline-none focus:border-orange-500 font-semibold"
              >
                <option value="Roads">Roads &amp; Transport</option>
                <option value="Water & Sewage">Water &amp; Sewage Planning</option>
                <option value="Electricity">Electricity Board</option>
                <option value="Sanitation">Sanitation Department</option>
                <option value="Public Infrastructure">Public Infrastructure</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Indicator */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assigned Severity</label>
              <div className="flex items-center gap-2">
                {['Low', 'Medium', 'High'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 text-xs py-2 rounded-lg font-bold border cursor-pointer transition-all ${
                      priority === p 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Location fetchers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Geo-Location Coordinates</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-800 font-bold cursor-pointer"
                >
                  <MapPin size={11} className={gpsLoading ? 'animate-bounce' : ''} />
                  <span>{gpsLoading ? 'Fetching GPS...' : 'Locate Me'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-gray-700 text-center font-mono font-bold shadow-inner">
                  Lat: {latitude.toFixed(5)}
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-gray-700 text-center font-mono font-bold shadow-inner">
                  Lng: {longitude.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Evidence attachments */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Evidence Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste custom photo URL or pick template below..."
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-orange-500 placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Template picker */}
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quick photo templates:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IMAGE_TEMPLATES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      imageUrl === img.url 
                        ? 'bg-orange-50 border-orange-400 text-orange-700 font-black shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon size={11} />
                    <span>{img.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg border border-gray-250 cursor-pointer transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              Dispatch Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
