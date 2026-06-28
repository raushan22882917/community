export type UserRole = 'public' | 'worker' | 'department' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string; // e.g. "Sanitation", "Roads", "Water & Sewage", "Electricity"
  points: number;
  created_at: string;
}

export type IssueStatus = 'reported' | 'validated' | 'in_progress' | 'resolved';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. "Pothole", "Water Leakage", "Damaged Streetlight", "Waste Management", "Infrastructure"
  status: IssueStatus;
  latitude: number;
  longitude: number;
  reporter_id: string;
  reporter_name: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  department: string;
  image_url?: string;
  video_url?: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_note?: string;
  resolution_image?: string;
}

export interface Verification {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  status: 'verified' | 'disputed';
  comments?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface LeaderboardUser {
  id: string;
  full_name: string;
  points: number;
  reports_count: number;
  verifications_count: number;
  rank: number;
}
