-- TAMP production hardening
-- Applied to the production Supabase project before this snapshot was committed.

create or replace function private.course_week_open(p_course_id text,p_week integer)
returns boolean language sql stable set search_path=public,pg_temp as $$
  select coalesce(
    current_date >= date_trunc('week', start_date)::date + ((greatest(p_week,1)-1)*7),
    false
  )
  from public.courses where id=p_course_id
$$;

create or replace function public.admin_publish_result(
  p_submission_id uuid,p_score integer,p_feedback text default null,p_award_title text default null
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_student_id uuid; v_assignment_id uuid; v_assignment_title text; v_result_id uuid;
begin
 if not (select private.is_admin()) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_score<0 or p_score>100 then raise exception 'Score must be between 0 and 100'; end if;
 select student_id,assignment_id into v_student_id,v_assignment_id from public.submissions where id=p_submission_id for update;
 if not found then raise exception 'Submission not found'; end if;
 select title into v_assignment_title from public.assignments where id=v_assignment_id;
 if v_assignment_title is null then raise exception 'Assignment not found'; end if;
 insert into public.assessment_results(submission_id,score,grade,feedback,reviewed_by)
 values(p_submission_id,p_score,case when p_score>=70 then 'Pass' else 'Needs improvement' end,p_feedback,auth.uid())
 on conflict(submission_id) do update set score=excluded.score,grade=excluded.grade,feedback=excluded.feedback,reviewed_by=excluded.reviewed_by,updated_at=now()
 returning id into v_result_id;
 update public.submissions set status='published',reviewed_at=now(),published_at=now() where id=p_submission_id;
 if nullif(trim(p_award_title),'') is not null then
   insert into public.awards(submission_id,student_id,title,description) values(p_submission_id,v_student_id,trim(p_award_title),'Award issued by TAMP.');
 end if;
 insert into public.notifications(user_id,title,message) values(v_student_id,'Assessment result published','Your result for '||v_assignment_title||' has been published.');
 return jsonb_build_object('submission_id',p_submission_id,'result_id',v_result_id,'score',p_score);
end $$;

create or replace function public.admin_issue_certificate(p_submission_id uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_student uuid; v_course_id text; v_student_id text; v_student_name text; v_certificate_id text; v_count integer; v_passed integer; v_inserted boolean:=false;
begin
 if not (select private.is_admin()) then raise exception 'Administrator access required' using errcode='42501'; end if;
 select s.student_id,a.course_id into v_student,v_course_id from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=p_submission_id;
 if not found then raise exception 'Submission not found'; end if;
 select count(*) into v_count from public.assignments where course_id=v_course_id;
 select count(*) into v_passed from public.assignments a where a.course_id=v_course_id and exists (
   select 1 from public.submissions s join public.assessment_results r on r.submission_id=s.id
   where s.assignment_id=a.id and s.student_id=v_student and s.status='published' and r.score>=70
 );
 if v_count=0 or v_passed<>v_count then raise exception 'Certificate blocked: every course assignment must have a published passing result of 70 or higher.'; end if;
 select p.student_id,p.full_name into v_student_id,v_student_name from public.profiles p where p.id=v_student;
 if v_student_id is null then raise exception 'Student profile not found'; end if;
 v_certificate_id:='CERT-'||v_student_id;
 insert into public.certificates(certificate_id,student_id,course_id,student_name,issue_date,status)
 values(v_certificate_id,v_student,v_course_id,coalesce(v_student_name,'Student'),current_date,'issued')
 on conflict(certificate_id) do nothing returning true into v_inserted;
 if v_inserted then
   insert into public.notifications(user_id,title,message) values(v_student,'Certificate issued','Your TAMP certificate for '||v_course_id||' is now available.');
 end if;
 return jsonb_build_object('certificate_id',v_certificate_id,'student_id',v_student_id,'course_id',v_course_id,'created',coalesce(v_inserted,false));
end $$;

revoke all on function public.admin_publish_result(uuid,integer,text,text) from public,anon;
grant execute on function public.admin_publish_result(uuid,integer,text,text) to authenticated;
revoke all on function public.admin_issue_certificate(uuid) from public,anon;
grant execute on function public.admin_issue_certificate(uuid) to authenticated;

drop policy if exists submissions_self_insert on public.submissions;
create policy submissions_self_insert on public.submissions for insert to authenticated
with check (
 (select auth.uid())=student_id and status='submitted'
 and exists (
   select 1 from public.assignments a
   where a.id=assignment_id and private.course_week_open(a.course_id,a.week_number)
   and exists (select 1 from public.enrollments e where e.user_id=(select auth.uid()) and e.course_id=a.course_id and e.status in ('active','completed'))
 )
);

drop policy if exists submissions_self_update on public.submissions;
drop policy if exists submissions_admin_update on public.submissions;
create policy submissions_update on public.submissions for update to authenticated
using(
 (select private.is_admin())
 or ((select auth.uid())=student_id and status in('submitted','returned'))
)
with check(
 (select private.is_admin())
 or (
   (select auth.uid())=student_id and status='submitted'
   and exists (
     select 1 from public.assignments a
     where a.id=assignment_id and private.course_week_open(a.course_id,a.week_number)
     and exists (select 1 from public.enrollments e where e.user_id=(select auth.uid()) and e.course_id=a.course_id and e.status in ('active','completed'))
   )
 )
);

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update to authenticated
using((select auth.uid())=user_id or (select private.is_admin()))
with check((select auth.uid())=user_id or (select private.is_admin()));
