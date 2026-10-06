create or replace function public.protect_profile_identity_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
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
$$;
