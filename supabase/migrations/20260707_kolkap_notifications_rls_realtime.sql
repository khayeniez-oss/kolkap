-- Kolkap notifications RLS + realtime
-- Purpose:
-- Allow authenticated workspace owners / recipients to read and update their own notifications.
-- Enable realtime so Kolkap mobile can receive all notification changes while the app is open.

alter table public.kolkap_notifications enable row level security;
alter table public.kolkap_notifications replica identity full;

drop policy if exists "kolkap notifications select own workspace" on public.kolkap_notifications;
drop policy if exists "kolkap notifications update own workspace" on public.kolkap_notifications;

create policy "kolkap notifications select own workspace"
on public.kolkap_notifications
for select
to authenticated
using (
  auth.uid() = owner_user_id
  or auth.uid() = recipient_user_id
);

create policy "kolkap notifications update own workspace"
on public.kolkap_notifications
for update
to authenticated
using (
  auth.uid() = owner_user_id
  or auth.uid() = recipient_user_id
)
with check (
  auth.uid() = owner_user_id
  or auth.uid() = recipient_user_id
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'kolkap_notifications'
  ) then
    alter publication supabase_realtime add table public.kolkap_notifications;
  end if;
end $$;
