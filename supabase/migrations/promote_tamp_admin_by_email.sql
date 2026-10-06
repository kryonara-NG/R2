create or replace function public.promote_tamp_admin_by_email(p_email text)
returns table(id uuid, student_id text, full_name text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.profiles p
  set role = 'admin', updated_at = now()
  from auth.users u
  where p.id = u.id
    and lower(u.email) = lower(trim(p_email))
  returning p.id, p.student_id, p.full_name, p.role;
end;
$$;
revoke all on function public.promote_tamp_admin_by_email(text) from public, anon, authenticated;
