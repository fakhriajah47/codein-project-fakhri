create index idx_profiles_user_id on public.profiles(user_id);

create index idx_workspace_members_user_id on public.workspace_members(user_id);
create index idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index idx_workspace_members_role on public.workspace_members(role);

create index idx_projects_workspace_id on public.projects(workspace_id);
create index idx_projects_status on public.projects(status);
create index idx_projects_priority on public.projects(priority);
create index idx_projects_health_status on public.projects(health_status);
create index idx_projects_due_date on public.projects(due_date);
create index idx_projects_archived_at on public.projects(archived_at);

create index idx_project_members_project_id on public.project_members(project_id);
create index idx_project_members_user_id on public.project_members(user_id);

create index idx_milestones_project_id on public.milestones(project_id);
create index idx_milestones_status on public.milestones(status);
create index idx_milestones_due_date on public.milestones(due_date);

create index idx_tasks_workspace_id on public.tasks(workspace_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_milestone_id on public.tasks(milestone_id);
create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_reporter_id on public.tasks(reporter_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_priority on public.tasks(priority);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_completed_at on public.tasks(completed_at);

create index idx_task_comments_task_id on public.task_comments(task_id);
create index idx_task_comments_user_id on public.task_comments(user_id);

create index idx_task_attachments_task_id on public.task_attachments(task_id);

create index idx_activity_logs_workspace_id on public.activity_logs(workspace_id);
create index idx_activity_logs_project_id on public.activity_logs(project_id);
create index idx_activity_logs_task_id on public.activity_logs(task_id);
create index idx_activity_logs_actor_id on public.activity_logs(actor_id);
create index idx_activity_logs_created_at on public.activity_logs(created_at);

create index idx_ai_generations_workspace_id on public.ai_generations(workspace_id);
create index idx_ai_generations_project_id on public.ai_generations(project_id);
create index idx_ai_generations_user_id on public.ai_generations(user_id);
create index idx_ai_generations_type on public.ai_generations(type);

create index idx_reports_workspace_id on public.reports(workspace_id);
create index idx_reports_project_id on public.reports(project_id);
create index idx_reports_status on public.reports(status);

create index idx_integration_settings_workspace_id on public.integration_settings(workspace_id);
create index idx_integration_settings_provider on public.integration_settings(provider);

create index idx_notification_logs_workspace_id on public.notification_logs(workspace_id);
create index idx_notification_logs_project_id on public.notification_logs(project_id);
create index idx_notification_logs_provider on public.notification_logs(provider);
create index idx_notification_logs_status on public.notification_logs(status);
