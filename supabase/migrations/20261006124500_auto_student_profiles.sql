-- TAMP automatic student profiles
-- Keep auth users and academic profiles in sync for every new signup.

create sequence if not exists public.tamp_student_id_seq;

select setval(
  'public.tamp_student_id_seq',
  greatest(
    coalesce(
      (
        select max((regexp_match(student_id,'TAMP-\\d{4}-(\\d+)$'))[1]::bigint)
        from public.profiles
        where student_id ~ '^TAMP-\\d{4}-\\d+$'
      ),
      0
    ),
    1
  ),
  true
);

create or replace function public.handle_new_tamp_profile()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_name text;
begin
  v_name:=coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Learner');

  insert into public.profiles(id,student_id,full_name,role)
  values(
    new.id,
    'TAMP-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.tamp_student_id_seq')::text,5,'0'),
    v_name,
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_tamp_profile() from public,anon,authenticated;
grant execute on function public.handle_new_tamp_profile() to postgres;

drop trigger if exists on_auth_user_created_tamp_profile on auth.users;
create trigger on_auth_user_created_tamp_profile
after insert on auth.users
for each row execute function public.handle_new_tamp_profile();
