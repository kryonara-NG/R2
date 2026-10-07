-- Fix pgcrypto digest resolution for enrollment keys.
-- Supabase installs pgcrypto functions in the extensions schema, and the
-- algorithm argument must be explicitly typed as text.
create or replace function public.redeem_enrollment_key(p_course_id text,p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $function$
declare
  v_key public.enrollment_keys%rowtype;
  v_profile public.profiles%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_unlock timestamptz := now() + interval '5 minutes';
begin
  if auth.uid() is null then raise exception 'You must be signed in.' using errcode='42501'; end if;
  select * into v_profile from public.profiles where id=auth.uid();
  if not found then raise exception 'Student profile not found.'; end if;
  if p_course_id <> 'da' then raise exception 'This course is not available.'; end if;
  if exists(select 1 from public.enrollments where user_id=auth.uid() and course_id=p_course_id and status in('active','completed')) then
    raise exception 'You are already enrolled in this course.';
  end if;
  select * into v_key from public.enrollment_keys
  where course_id=p_course_id and active=true and redeemed_at is null
    and (expires_at is null or expires_at > now())
    and code_hash=encode(extensions.digest(upper(trim(p_code)), 'sha256'::text),'hex')
  for update;
  if not found then raise exception 'Invalid, expired, or already used enrollment key.'; end if;
  update public.enrollment_keys set redeemed_by=auth.uid(),redeemed_at=now(),active=false where id=v_key.id;
  insert into public.enrollments(user_id,course_id,status,payment_confirmed,enrolled_at,unlock_at,enrollment_key_id,approved_at)
  values(auth.uid(),p_course_id,'pending',true,now(),v_unlock,v_key.id,now())
  on conflict(user_id,course_id) do update set status='pending',payment_confirmed=true,enrolled_at=now(),unlock_at=v_unlock,enrollment_key_id=v_key.id,approved_at=now()
  returning * into v_enrollment;
  return jsonb_build_object('enrollment_id',v_enrollment.id,'status',v_enrollment.status,'unlock_at',v_enrollment.unlock_at,'course_id',v_enrollment.course_id);
end $function$;

create or replace function public.admin_generate_enrollment_keys(p_course_id text,p_count integer,p_label text default null)
returns table(id uuid, code text, label text, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $function$
declare i integer; v_code text; v_id uuid; v_created timestamptz;
begin
 if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_count<1 or p_count>100 then raise exception 'Generate between 1 and 100 keys.'; end if;
 for i in 1..p_count loop
   v_code:='TAMP-'||upper(encode(extensions.gen_random_bytes(5),'hex'));
   insert into public.enrollment_keys(course_id,code_hash,label)
   values(p_course_id,encode(extensions.digest(v_code,'sha256'::text),'hex'),coalesce(p_label,'TAMP enrollment key'))
   returning enrollment_keys.id,enrollment_keys.created_at into v_id,v_created;
   id:=v_id; code:=v_code; label:=coalesce(p_label,'TAMP enrollment key'); created_at:=v_created; return next;
 end loop;
end $function$;