-- Kolkap notifications RLS
-- Added for mobile app alerts access.
-- Allows authenticated workspace owners / recipients to read and update their own notifications.

alter table kolkap_notifications enable row level security;

drop policy if exists "kolkap notifications select own workspace" on kolkap_notifications;
drop policy if exists "kolkap notifications update own workspace" on kolkap_notifications;

create policy "kolkap notifications select own workspace"
on kolkap_notifications
for select
to authenticated
using (
  auth.uid() = owner_user_id
  or auth.uid() = recipient_user_id
);

create policy "kolkap notifications update own workspace"
on kolkap_notifications
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
