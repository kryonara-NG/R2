-- TAMP production security hardening v2
-- Protect profile identity fields, restrict enrollment creation to trusted key redemption,
-- scope enrollment activation to the signed-in student, and block executable web assets in uploads.

create or replace function public.protect_profile_identity_fields()
returns trigger
language plpgsql
security definer
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

drop trigger if exists protect_profile_identity_fields on public.profiles;
create trigger protect_profile_identity_fields
before update on public.profiles
for each row execute function public.protect_profile_identity_fields();

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update to authenticated
using ((select auth.uid()) = id or (select private.is_admin()))
with check (
  (select private.is_admin())
  or ((select auth.uid()) = id and role = 'student')
);

drop policy if exists enrollments_self_insert on public.enrollments;

revoke all on function public.activate_due_enrollments() from public, anon, authenticated;
drop function if exists public.activate_due_enrollments();

create or replace function public.activate_due_enrollments(p_course_id text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode='42501';
  end if;

  update public.enrollments
  set status='active'
  where user_id=auth.uid()
    and course_id=p_course_id
    and status='pending'
    and payment_confirmed=true
    and unlock_at is not null
    and unlock_at <= now();

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.activate_due_enrollments(text) from public, anon;
grant execute on function public.activate_due_enrollments(text) to authenticated;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
],
file_size_limit = 20971520
where id='submissions';
