-- Fix TAMP profile-update trigger access to the private admin helper.
-- The trigger must run with owner privileges so authenticated users do not
-- need direct access to the private schema.
create or replace function public.protect_profile_identity_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not private.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change account role.' using errcode='42501';
    end if;
    if new.student_id is distinct from old.student_id then
      raise exception 'Student ID is managed by TAMP and cannot be changed.' using errcode='42501';
    end if;
  end if;
  return new;
end;
$function$;

revoke execute on function public.protect_profile_identity_fields() from public, anon, authenticated;
