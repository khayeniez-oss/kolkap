begin;

create table if not exists public.ai_staff_knowledge_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  ai_staff_id uuid not null references public.ai_staff(id) on delete cascade,
  knowledge_id uuid not null references public.workspace_knowledge_base(id) on delete cascade,
  created_by_user_id uuid,
  created_at timestamp with time zone not null default now(),

  constraint ai_staff_knowledge_links_unique
    unique (workspace_id, ai_staff_id, knowledge_id)
);

create index if not exists ai_staff_knowledge_links_workspace_idx
  on public.ai_staff_knowledge_links (workspace_id);

create index if not exists ai_staff_knowledge_links_ai_staff_idx
  on public.ai_staff_knowledge_links (ai_staff_id);

create index if not exists ai_staff_knowledge_links_knowledge_idx
  on public.ai_staff_knowledge_links (knowledge_id);

create or replace function public.validate_ai_staff_knowledge_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.ai_staff staff
    where staff.id = new.ai_staff_id
      and staff.workspace_id = new.workspace_id
      and staff.deleted_at is null
      and coalesce(staff.status, '') <> 'deleted'
  ) then
    raise exception 'AI staff does not belong to this workspace.';
  end if;

  if not exists (
    select 1
    from public.workspace_knowledge_base kb
    where kb.id = new.knowledge_id
      and kb.workspace_id = new.workspace_id
      and coalesce(kb.status, 'active') <> 'archived'
  ) then
    raise exception 'Knowledge item does not belong to this workspace.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_ai_staff_knowledge_link_trigger
  on public.ai_staff_knowledge_links;

create trigger validate_ai_staff_knowledge_link_trigger
before insert or update on public.ai_staff_knowledge_links
for each row
execute function public.validate_ai_staff_knowledge_link();

alter table public.ai_staff_knowledge_links enable row level security;

drop policy if exists "Users can view their ai staff knowledge links"
  on public.ai_staff_knowledge_links;

create policy "Users can view their ai staff knowledge links"
on public.ai_staff_knowledge_links
for select
using (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = ai_staff_knowledge_links.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage their ai staff knowledge links"
  on public.ai_staff_knowledge_links;

create policy "Users can manage their ai staff knowledge links"
on public.ai_staff_knowledge_links
for all
using (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = ai_staff_knowledge_links.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = ai_staff_knowledge_links.workspace_id
      and workspace.owner_user_id = auth.uid()
  )
);

commit;
