alter table public.ai_staff
add column if not exists activation_credits_charged_at timestamptz,
add column if not exists activation_credits_used integer not null default 0,
add column if not exists last_edit_credits_charged_at timestamptz,
add column if not exists last_edit_credits_used integer not null default 0,
add column if not exists activated_at timestamptz,
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by_user_id uuid;

create index if not exists ai_staff_workspace_deleted_idx
on public.ai_staff (workspace_id, deleted_at);

create index if not exists ai_staff_workspace_status_idx
on public.ai_staff (workspace_id, status);
