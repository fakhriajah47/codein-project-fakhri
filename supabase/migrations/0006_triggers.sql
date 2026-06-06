-- 8.1 updated_at Triggers
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_milestones_updated_at
before update on public.milestones
for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger set_task_comments_updated_at
before update on public.task_comments
for each row execute function public.set_updated_at();

create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create trigger set_integration_settings_updated_at
before update on public.integration_settings
for each row execute function public.set_updated_at();

-- 8.2 completed_at Trigger for Tasks
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (old.status is null or old.status is distinct from 'done') then
    new.completed_at = now();
  end if;

  if new.status is distinct from 'done' then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

create trigger set_tasks_completed_at
before update of status on public.tasks
for each row execute function public.set_task_completed_at();
