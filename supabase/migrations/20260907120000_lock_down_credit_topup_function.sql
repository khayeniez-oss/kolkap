begin;

revoke execute on function
  public.complete_workspace_credit_topup(uuid, text, text, text)
from public;

revoke execute on function
  public.complete_workspace_credit_topup(uuid, text, text, text)
from anon;

revoke execute on function
  public.complete_workspace_credit_topup(uuid, text, text, text)
from authenticated;

grant execute on function
  public.complete_workspace_credit_topup(uuid, text, text, text)
to service_role;

commit;
