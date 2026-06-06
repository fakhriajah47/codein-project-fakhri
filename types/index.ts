export type JsonRecord = Record<string, unknown>;

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export type WorkspaceRole = 'owner' | 'manager' | 'member' | 'viewer';
export type WorkspaceMemberStatus = 'invited' | 'active' | 'suspended';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  profiles?: Profile;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectHealthStatus = 'healthy' | 'at_risk' | 'critical' | 'completed';

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  client_name: string | null;
  project_type: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  health_status: ProjectHealthStatus;
  risk_score: number;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  profiles?: Profile;
}

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  acceptance_criteria: string[];
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignee?: Profile | null;
  reporter?: Profile | null;
  project?: Project;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: JsonRecord;
  created_at: string;
  actor?: Profile;
}

export type AIGenerationType =
  | 'task_generation'
  | 'risk_analysis'
  | 'executive_summary'
  | 'daily_focus'
  | 'report_generation';

export interface AIGeneration {
  id: string;
  workspace_id: string;
  project_id: string | null;
  user_id: string | null;
  type: AIGenerationType;
  prompt: string | null;
  response: JsonRecord | null;
  status: 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

export type ReportType = 'daily' | 'weekly' | 'executive' | 'client' | 'risk';
export type ReportStatus = 'draft' | 'sent' | 'archived';

export interface Report {
  id: string;
  workspace_id: string;
  project_id: string;
  created_by: string | null;
  title: string;
  type: ReportType;
  target_audience: 'internal' | 'ceo' | 'client';
  content: {
    summary: string;
    completedWork: string[];
    pendingWork: string[];
    risks: string[];
    nextActions: string[];
    [key: string]: unknown;
  };
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export type IntegrationProvider = 'discord' | 'telegram' | 'gmail';

export interface IntegrationSetting {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  config: JsonRecord;
  is_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  workspace_id: string;
  project_id: string | null;
  provider: IntegrationProvider;
  event_type: string;
  payload: JsonRecord;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}
