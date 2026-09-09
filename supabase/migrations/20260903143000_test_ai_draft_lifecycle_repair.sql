begin;

update public.ai_staff
set status = 'draft',
    updated_at = now()
where lower(trim(coalesce(status, ''))) = 'testing'
  and deleted_at is null
  and activation_credits_charged_at is null;

update public.business_workspaces as workspace
set ai_staff_used = (
      select count(*)::integer
      from public.ai_staff as staff
      where staff.workspace_id = workspace.id
        and staff.deleted_at is null
        and lower(trim(coalesce(staff.status, ''))) <> 'draft'
    ),
    updated_at = now()
where workspace.ai_staff_used is distinct from (
  select count(*)::integer
  from public.ai_staff as staff
  where staff.workspace_id = workspace.id
    and staff.deleted_at is null
    and lower(trim(coalesce(staff.status, ''))) <> 'draft'
);

commit;
