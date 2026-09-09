begin;

alter table public.workspace_credit_balances
add column if not exists last_renewal_invoice_id text;

create unique index if not exists workspace_credit_balances_renewal_invoice_idx
on public.workspace_credit_balances (last_renewal_invoice_id)
where last_renewal_invoice_id is not null;

create or replace function public.renew_workspace_plan_credits(
  p_workspace_id uuid,
  p_stripe_invoice_id text,
  p_plan_name text,
  p_plan_credits integer,
  p_billing_period_start timestamptz,
  p_billing_period_end timestamptz
)
returns table (
  workspace_id uuid,
  credits_added integer,
  credits_left integer,
  already_processed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  balance_row public.workspace_credit_balances%rowtype;
  credit_grant integer := greatest(coalesce(p_plan_credits, 0), 0);
begin
  if p_workspace_id is null then
    raise exception 'Workspace is required.';
  end if;

  if nullif(trim(p_stripe_invoice_id), '') is null then
    raise exception 'Stripe invoice is required.';
  end if;

  if p_billing_period_end is null then
    raise exception 'Billing period end is required.';
  end if;

  update public.workspace_credit_balances as balance
  set plan_name = coalesce(nullif(trim(p_plan_name), ''), balance.plan_name),
      plan_credits = greatest(coalesce(balance.plan_credits, 0), 0) + credit_grant,
      status = 'active',
      billing_period_start = p_billing_period_start,
      billing_period_end = p_billing_period_end,
      last_renewal_invoice_id = p_stripe_invoice_id,
      updated_at = now()
  where balance.workspace_id = p_workspace_id
    and balance.last_renewal_invoice_id is distinct from p_stripe_invoice_id
    and (
      balance.billing_period_end is null
      or balance.billing_period_end < p_billing_period_end
    )
  returning balance.* into balance_row;

  if found then
    workspace_id := balance_row.workspace_id;
    credits_added := credit_grant;
    credits_left := greatest(
      coalesce(balance_row.plan_credits, 0)
        + coalesce(balance_row.purchased_credits, 0)
        - coalesce(balance_row.used_credits, 0),
      0
    );
    already_processed := false;
    return next;
    return;
  end if;

  select balance.*
  into balance_row
  from public.workspace_credit_balances as balance
  where balance.workspace_id = p_workspace_id;

  if not found then
    raise exception 'Workspace credit balance not found.';
  end if;

  workspace_id := balance_row.workspace_id;
  credits_added := 0;
  credits_left := greatest(
    coalesce(balance_row.plan_credits, 0)
      + coalesce(balance_row.purchased_credits, 0)
      - coalesce(balance_row.used_credits, 0),
    0
  );
  already_processed := true;
  return next;
end;
$$;

revoke all on function public.renew_workspace_plan_credits(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) from public;

revoke all on function public.renew_workspace_plan_credits(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) from anon;

revoke all on function public.renew_workspace_plan_credits(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) from authenticated;

grant execute on function public.renew_workspace_plan_credits(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) to service_role;

commit;
