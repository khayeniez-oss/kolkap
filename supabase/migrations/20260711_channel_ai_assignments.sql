create table if not exists public.channel_ai_assignments (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,

  channel_type text not null check (
    channel_type in ('website_chat', 'whatsapp')
  ),

  channel_connection_id uuid not null,

  ai_staff_id uuid not null references public.ai_staff(id) on delete cascade,

  is_enabled boolean not null default true,
  is_default boolean not null default false,

  priority integer not null default 100,
  routing_notes text,

  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (workspace_id, channel_type, channel_connection_id, ai_staff_id)
);

create unique index if not exists channel_ai_assignments_one_default_idx
on public.channel_ai_assignments (workspace_id, channel_type, channel_connection_id)
where is_default = true and is_enabled = true;

create index if not exists channel_ai_assignments_workspace_idx
on public.channel_ai_assignments (workspace_id);

create index if not exists channel_ai_assignments_channel_idx
on public.channel_ai_assignments (
  workspace_id,
  channel_type,
  channel_connection_id,
  is_enabled,
  priority
);

create index if not exists channel_ai_assignments_ai_staff_idx
on public.channel_ai_assignments (ai_staff_id);

create or replace function public.set_channel_ai_assignments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_channel_ai_assignments_updated_at
on public.channel_ai_assignments;

create trigger set_channel_ai_assignments_updated_at
before update on public.channel_ai_assignments
for each row
execute function public.set_channel_ai_assignments_updated_at();

create or replace function public.validate_channel_ai_assignment()
returns trigger
language plpgsql
as $$
declare
  channel_exists boolean;
  staff_exists boolean;
begin
  select exists (
    select 1
    from public.ai_staff staff
    where staff.id = new.ai_staff_id
      and staff.workspace_id = new.workspace_id
      and staff.deleted_at is null
      and coalesce(staff.status, 'active') = 'active'
  )
  into staff_exists;

  if not staff_exists then
    raise exception 'AI staff must be active and belong to the same workspace.';
  end if;

  if new.channel_type = 'website_chat' then
    select exists (
      select 1
      from public.workspace_website_chat_settings settings
      where settings.id = new.channel_connection_id
        and settings.workspace_id = new.workspace_id
    )
    into channel_exists;
  elsif new.channel_type = 'whatsapp' then
    select exists (
      select 1
      from public.workspace_whatsapp_connections connection
      where connection.id = new.channel_connection_id
        and connection.workspace_id = new.workspace_id
    )
    into channel_exists;
  else
    channel_exists := false;
  end if;

  if not channel_exists then
    raise exception 'Channel connection must belong to the same workspace.';
  end if;

  if new.is_default = true and new.is_enabled = true then
    update public.channel_ai_assignments
    set is_default = false,
        updated_at = now()
    where workspace_id = new.workspace_id
      and channel_type = new.channel_type
      and channel_connection_id = new.channel_connection_id
      and id is distinct from new.id
      and is_default = true;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_channel_ai_assignment
on public.channel_ai_assignments;

create trigger validate_channel_ai_assignment
before insert or update on public.channel_ai_assignments
for each row
execute function public.validate_channel_ai_assignment();

alter table public.channel_ai_assignments enable row level security;

drop policy if exists "channel_ai_assignments_select_owner"
on public.channel_ai_assignments;

create policy "channel_ai_assignments_select_owner"
on public.channel_ai_assignments
for select
using (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = channel_ai_assignments.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);

drop policy if exists "channel_ai_assignments_insert_owner"
on public.channel_ai_assignments;

create policy "channel_ai_assignments_insert_owner"
on public.channel_ai_assignments
for insert
with check (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = channel_ai_assignments.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);

drop policy if exists "channel_ai_assignments_update_owner"
on public.channel_ai_assignments;

create policy "channel_ai_assignments_update_owner"
on public.channel_ai_assignments
for update
using (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = channel_ai_assignments.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = channel_ai_assignments.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);

drop policy if exists "channel_ai_assignments_delete_owner"
on public.channel_ai_assignments;

create policy "channel_ai_assignments_delete_owner"
on public.channel_ai_assignments
for delete
using (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = channel_ai_assignments.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);
