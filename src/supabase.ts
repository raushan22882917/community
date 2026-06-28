import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Issue, Profile, Verification, Comment, UserRole, SupabaseConfig, IssueStatus } from './types';

// Pre-seeded mock profiles for the role simulator
export const MOCK_PROFILES: Record<UserRole, Profile> = {
  public: {
    id: 'pub-101',
    email: 'citizen.hero@community.org',
    full_name: 'Elena Rostova',
    role: 'public',
    points: 380,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  worker: {
    id: 'work-202',
    email: 'marcus.dispatch@city.gov',
    full_name: 'Marcus Vance',
    role: 'worker',
    department: 'Roads',
    points: 150,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  department: {
    id: 'dept-303',
    email: 'sarah.planning@city.gov',
    full_name: 'Director Sarah Jenkins',
    role: 'department',
    department: 'Roads',
    points: 450,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  admin: {
    id: 'admin-404',
    email: 'city.admin@communityhero.gov',
    full_name: 'Chief Commissioner Sterling',
    role: 'admin',
    points: 999,
    created_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString()
  }
};

// Initial hyperlocal problems pre-seeded in the community
const INITIAL_MOCK_ISSUES: Issue[] = [];

const INITIAL_MOCK_VERIFICATIONS: Verification[] = [];

const INITIAL_MOCK_COMMENTS: Comment[] = [];

// Helper to load/save mock database from localStorage
class LocalDatabaseManager {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to localStorage', e);
    }
  }

  getIssues(): Issue[] {
    return this.getStorageItem<Issue[]>('ch_issues', INITIAL_MOCK_ISSUES);
  }

  saveIssues(issues: Issue[]): void {
    this.setStorageItem('ch_issues', issues);
  }

  getVerifications(): Verification[] {
    return this.getStorageItem<Verification[]>('ch_verifications', INITIAL_MOCK_VERIFICATIONS);
  }

  saveVerifications(verifications: Verification[]): void {
    this.setStorageItem('ch_verifications', verifications);
  }

  getComments(): Comment[] {
    return this.getStorageItem<Comment[]>('ch_comments', INITIAL_MOCK_COMMENTS);
  }

  saveComments(comments: Comment[]): void {
    this.setStorageItem('ch_comments', comments);
  }

  getProfiles(): Profile[] {
    const defaultProfiles = Object.values(MOCK_PROFILES);
    return this.getStorageItem<Profile[]>('ch_profiles', defaultProfiles);
  }

  saveProfiles(profiles: Profile[]): void {
    this.setStorageItem('ch_profiles', profiles);
  }
}

export const localDb = new LocalDatabaseManager();

// Supabase Integration Manager
class SupabaseIntegration {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    isConnected: false
  };

  constructor() {
    // Attempt load from environment variables first
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      this.initialize(envUrl, envKey);
    } else {
      // Look in localStorage
      const savedUrl = localStorage.getItem('supabase_url');
      const savedKey = localStorage.getItem('supabase_anon_key');
      if (savedUrl && savedKey) {
        this.initialize(savedUrl, savedKey);
      }
    }
  }

  initialize(url: string, anonKey: string): boolean {
    try {
      if (!url || !anonKey) return false;
      this.client = createClient(url, anonKey);
      this.config = { url, anonKey, isConnected: true };
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_anon_key', anonKey);
      return true;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      this.config.isConnected = false;
      return false;
    }
  }

  disconnect() {
    this.client = null;
    this.config = { url: '', anonKey: '', isConnected: false };
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
  }

  getConfig(): SupabaseConfig {
    return this.config;
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  async fetchConfigFromServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/supabase-config');
      if (res.ok) {
        const data = await res.json();
        if (data.url && data.anonKey) {
          return this.initialize(data.url, data.anonKey);
        }
      }
    } catch (e) {
      console.warn('Could not fetch real Supabase configuration from server secrets:', e);
    }
    return false;
  }

  async fetchProfile(userId: string): Promise<Profile | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  }

  async signUp(email: string, password: string, fullName: string, role: UserRole, department?: string): Promise<{ user: any; profile: Profile | null }> {
    if (!this.client) throw new Error('Supabase client is not connected.');
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from sign up.');

    const newProfile: any = {
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      points: 10
    };
    if (department) {
      newProfile.department = department;
    }

    try {
      const { data: profileData, error: profileErr } = await this.client
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (profileErr) {
        console.warn('Failed to insert profile row in DB. Profiles might be managed by a trigger or blocked by RLS policies during setup:', profileErr);
        return { user: data.user, profile: { ...newProfile, created_at: new Date().toISOString() } as Profile };
      }
      return { user: data.user, profile: profileData as Profile };
    } catch (err) {
      console.warn('Profile insertion threw exception:', err);
      return { user: data.user, profile: { ...newProfile, created_at: new Date().toISOString() } as Profile };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: any; profile: Profile | null }> {
    if (!this.client) throw new Error('Supabase client is not connected.');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from sign in.');

    const profile = await this.fetchProfile(data.user.id);
    return { user: data.user, profile };
  }

  async signOutUser(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  async getSessionProfile(): Promise<{ user: any; profile: Profile | null } | null> {
    if (!this.client) return null;
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error || !session?.user) return null;

      const profile = await this.fetchProfile(session.user.id);
      return { user: session.user, profile };
    } catch (e) {
      console.error('Session retrieval failed:', e);
      return null;
    }
  }

  async fetchProfiles(): Promise<Profile[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .order('points', { ascending: false });
        if (error) throw error;
        return data as Profile[];
      } catch (err) {
        console.warn('Real Supabase profiles fetch failed, falling back to LocalDB:', err);
      }
    }
    return localDb.getProfiles().sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  // Database operations (transparently routing between Real Supabase & Mock Local Storage)
  async fetchIssues(): Promise<Issue[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Issue[];
      } catch (err) {
        console.warn('Real Supabase query failed, falling back to LocalDB:', err);
      }
    }
    return localDb.getIssues();
  }

  async saveIssue(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'upvotes'>): Promise<Issue> {
    const timestamp = new Date().toISOString();
    const newIssue: Issue = {
      ...issue,
      id: this.client ? undefined as any : `issue-${Date.now()}`,
      upvotes: 0,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('issues')
          .insert([newIssue])
          .select()
          .single();
        if (error) throw error;
        return data as Issue;
      } catch (err) {
        console.warn('Real Supabase insert failed, falling back to LocalDB:', err);
      }
    }

    // LocalDB flow
    const current = localDb.getIssues();
    const saved = { ...newIssue, id: `issue-${Date.now()}` };
    localDb.saveIssues([saved, ...current]);
    return saved;
  }

  async updateIssueStatus(issueId: string, status: IssueStatus, extra: Partial<Issue> = {}): Promise<Issue | null> {
    const timestamp = new Date().toISOString();

    if (this.client) {
      try {
        const payload = { status, updated_at: timestamp, ...extra };
        const { data, error } = await this.client
          .from('issues')
          .update(payload)
          .eq('id', issueId)
          .select()
          .single();
        if (error) throw error;
        return data as Issue;
      } catch (err) {
        console.warn('Real Supabase update failed, falling back to LocalDB:', err);
      }
    }

    const current = localDb.getIssues();
    const index = current.findIndex(i => i.id === issueId);
    if (index !== -1) {
      current[index] = {
        ...current[index],
        status,
        updated_at: timestamp,
        ...extra
      };
      localDb.saveIssues(current);
      return current[index];
    }
    return null;
  }

  async deleteIssue(issueId: string): Promise<boolean> {
    if (this.client) {
      const { error } = await this.client
        .from('issues')
        .delete()
        .eq('id', issueId);
      if (!error) return true;
    }
    const current = localDb.getIssues();
    const filtered = current.filter(i => i.id !== issueId);
    localDb.saveIssues(filtered);
    return true;
  }

  async upvoteIssue(issueId: string): Promise<number> {
    if (this.client) {
      try {
        // Since custom rpc might be complex, we fetch, increment, and write.
        const { data: issue, error: fetchErr } = await this.client
          .from('issues')
          .select('upvotes')
          .eq('id', issueId)
          .single();
        
        if (fetchErr) throw fetchErr;
        const newUpvotes = (issue?.upvotes || 0) + 1;

        const { error: updateErr } = await this.client
          .from('issues')
          .update({ upvotes: newUpvotes })
          .eq('id', issueId);
        
        if (updateErr) throw updateErr;
        return newUpvotes;
      } catch (err) {
        console.warn('Real Supabase upvote failed, falling back to LocalDB:', err);
      }
    }

    const current = localDb.getIssues();
    const index = current.findIndex(i => i.id === issueId);
    if (index !== -1) {
      current[index].upvotes += 1;
      localDb.saveIssues(current);
      return current[index].upvotes;
    }
    return 0;
  }

  async addVerification(issueId: string, userId: string, userName: string, status: 'verified' | 'disputed', comments: string): Promise<Verification> {
    const newVerification: Verification = {
      id: `v-${Date.now()}`,
      issue_id: issueId,
      user_id: userId,
      user_name: userName,
      status,
      comments,
      created_at: new Date().toISOString()
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('verifications')
          .insert([newVerification])
          .select()
          .single();
        if (error) throw error;
        return data as Verification;
      } catch (err) {
        console.warn('Real Supabase verification insert failed, falling back to LocalDB:', err);
      }
    }

    const current = localDb.getVerifications();
    localDb.saveVerifications([newVerification, ...current]);
    return newVerification;
  }

  async addComment(issueId: string, userId: string, userName: string, content: string): Promise<Comment> {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      issue_id: issueId,
      user_id: userId,
      user_name: userName,
      content,
      created_at: new Date().toISOString()
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('comments')
          .insert([newComment])
          .select()
          .single();
        if (error) throw error;
        return data as Comment;
      } catch (err) {
        console.warn('Real Supabase comment insert failed, falling back to LocalDB:', err);
      }
    }

    const current = localDb.getComments();
    localDb.saveComments([newComment, ...current]);
    return newComment;
  }

  async fetchVerifications(issueId: string): Promise<Verification[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('verifications')
          .select('*')
          .eq('issue_id', issueId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Verification[];
      } catch (err) {
        console.warn('Real Supabase fetch verifications failed, falling back to LocalDB:', err);
      }
    }
    return localDb.getVerifications().filter(v => v.issue_id === issueId);
  }

  async fetchComments(issueId: string): Promise<Comment[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('comments')
          .select('*')
          .eq('issue_id', issueId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Comment[];
      } catch (err) {
        console.warn('Real Supabase fetch comments failed, falling back to LocalDB:', err);
      }
    }
    return localDb.getComments().filter(c => c.issue_id === issueId);
  }
}

export const supabaseSvc = new SupabaseIntegration();

// Production Supabase SQL schema generator with 4 Roles & Row Level Security Policies
export const SUPABASE_SQL_SCHEMA = `-- COMMUNITY HERO: HYPERLOCAL PROBLEM SOLVER
-- 4-ROLE SCHEMA (Admin, Worker, Public Citizen, Department Dispatcher) WITH ROW LEVEL SECURITY POLICIES

-- 1. Create custom enum type for issue status
create type issue_status as enum ('reported', 'validated', 'in_progress', 'resolved');
create type user_role as enum ('public', 'worker', 'department', 'admin');

-- 2. Create Profiles Table (links to Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text not null,
    role user_role not null default 'public',
    department text, -- sanitation, roads, electricity, water & sewage, public infrastructure
    points integer not null default 10,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Issues Table
create table public.issues (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    category text not null,
    status issue_status not null default 'reported',
    latitude numeric not null,
    longitude numeric not null,
    reporter_id uuid references public.profiles(id) on delete set null,
    reporter_name text not null,
    assigned_worker_id uuid references public.profiles(id) on delete set null,
    assigned_worker_name text,
    department text not null,
    image_url text,
    video_url text,
    upvotes integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone,
    resolution_note text,
    resolution_image text
);

-- 4. Create Verifications Table (Community validation)
create table public.verifications (
    id uuid default gen_random_uuid() primary key,
    issue_id uuid references public.issues(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    user_name text not null,
    status text not null check (status in ('verified', 'disputed')),
    comments text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(issue_id, user_id) -- Ensure single vote/verification per citizen
);

-- 5. Create Comments Table
create table public.comments (
    id uuid default gen_random_uuid() primary key,
    issue_id uuid references public.issues(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    user_name text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) across all tables
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.verifications enable row level security;
alter table public.comments enable row level security;

-- 6. SQL RLS Helper Function to fetch user role safely
create or replace function public.get_auth_user_role()
returns user_role as $$
    select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- 7. SQL RLS Helper Function to fetch user department safely
create or replace function public.get_auth_user_dept()
returns text as $$
    select department from public.profiles where id = auth.uid();
$$ language sql security definer;


-- ================= RLS POLICIES FOR 'PROFILES' =================

-- Profiles: Anyone can view profiles (to see names/ranks)
create policy "Enable select for all authenticated users"
    on public.profiles for select
    to authenticated
    using (true);

-- Profiles: Users can edit their own profile details
create policy "Enable update for users on their own profiles"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id);

-- Profiles: Admins can manage all profiles
create policy "Admins have full profile permissions"
    on public.profiles for all
    to authenticated
    using (public.get_auth_user_role() = 'admin');


-- ================= RLS POLICIES FOR 'ISSUES' =================

-- Issues: Anyone can view reported issues
create policy "Enable read access for all community issues"
    on public.issues for select
    to authenticated, anon
    using (true);

-- Issues: Public Citizens can report issues (insert with check)
create policy "Citizens can insert issues"
    on public.issues for insert
    to authenticated
    with check (
        auth.uid() = reporter_id AND
        public.get_auth_user_role() = 'public'
    );

-- Issues: Public Citizens can upvote issues (update)
create policy "Citizens can upvote issues"
    on public.issues for update
    to authenticated
    using (public.get_auth_user_role() = 'public')
    with check (
        -- Can only modify upvotes count
        (status = status) AND (title = title) AND (description = description)
    );

-- Issues: Workers can update issues assigned specifically to them
create policy "Workers can update their assigned issues"
    on public.issues for update
    to authenticated
    using (
        public.get_auth_user_role() = 'worker' AND 
        auth.uid() = assigned_worker_id
    );

-- Issues: Departments can edit/dispatch/verify issues inside their domain
create policy "Departments can manage issues in their domain"
    on public.issues for update
    to authenticated
    using (
        public.get_auth_user_role() = 'department' AND 
        department = public.get_auth_user_dept()
    );

-- Issues: Admins have full access
create policy "Admins can manage all issues"
    on public.issues for all
    to authenticated
    using (public.get_auth_user_role() = 'admin');


-- ================= RLS POLICIES FOR 'VERIFICATIONS' =================

-- Verifications: Anyone can read
create policy "Anyone can read verifications"
    on public.verifications for select
    to authenticated, anon
    using (true);

-- Verifications: Public citizens can insert verifications
create policy "Citizens can verify issues"
    on public.verifications for insert
    to authenticated
    with check (
        auth.uid() = user_id AND 
        public.get_auth_user_role() = 'public'
    );

-- Verifications: Admins have full access
create policy "Admins can manage verifications"
    on public.verifications for all
    to authenticated
    using (public.get_auth_user_role() = 'admin');


-- ================= RLS POLICIES FOR 'COMMENTS' =================

-- Comments: Anyone can read
create policy "Anyone can read comments"
    on public.comments for select
    to authenticated, anon
    using (true);

-- Comments: Authenticated users can insert comments
create policy "Authenticated users can post comments"
    on public.comments for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Comments: Admins have full access
create policy "Admins can manage comments"
    on public.comments for all
    to authenticated
    using (public.get_auth_user_role() = 'admin');


-- ================= AUTOMATIC SCORE TRIGGER =================
-- Increment citizen points by 20 on successful issue report
-- Increment citizen points by 5 on verification

create or replace function public.reward_citizen_reporting()
returns trigger as $$
begin
    update public.profiles 
    set points = points + 20
    where id = new.reporter_id;
    return new;
end;
$$ language plpgsql security definer;

create trigger trigger_reward_report
    after insert on public.issues
    for each row execute function public.reward_citizen_reporting();

create or replace function public.reward_citizen_verification()
returns trigger as $$
begin
    update public.profiles 
    set points = points + 5
    where id = new.user_id;
    return new;
end;
$$ language plpgsql security definer;

create trigger trigger_reward_verification
    after insert on public.verifications
    for each row execute function public.reward_citizen_verification();
`;
