-- TAMP daily reading resume + assessment integrity
-- The daily question bank is seeded in the earlier course-content migrations and
-- is verified at deployment time; this migration only adds runtime integrity.

alter table public.topic_reading_progress
  add column if not exists scroll_top integer not null default 0;

create or replace function public.save_topic_reading_position(
  p_course_id text,p_course_level_id uuid,p_day_number integer,p_scroll_top integer
)
returns public.topic_reading_progress
language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v public.topic_reading_progress;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not exists(select 1 from public.enrollments where user_id=auth.uid() and course_id=p_course_id and status='active')
 then raise exception 'Active course enrollment required' using errcode='42501'; end if;
 insert into public.topic_reading_progress(student_id,course_id,course_level_id,day_number,started_at,scroll_top)
 values(auth.uid(),p_course_id,p_course_level_id,p_day_number,now(),greatest(coalesce(p_scroll_top,0),0))
 on conflict(student_id,course_level_id,day_number)
 do update set scroll_top=greatest(0,coalesce(excluded.scroll_top,0))
 returning * into v;
 return v;
end
$fn$;

create or replace function public.submit_graded_quiz(
 p_attempt_id uuid,p_answers jsonb,p_pacing_seconds integer
)
returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare
 a public.quiz_attempts; q public.quizzes; x record;
 total numeric:=0; earned numeric:=0; ans text; score numeric; limit_seconds integer;
begin
 select * into a from public.quiz_attempts
 where id=p_attempt_id and student_id=auth.uid() for update;
 if not found or a.status<>'in_progress' then raise exception 'This quiz attempt cannot be submitted'; end if;
 select * into q from public.quizzes where id=a.quiz_id;
 limit_seconds:=coalesce(q.time_limit_minutes,0)*60;
 if limit_seconds>0 and extract(epoch from(now()-a.started_at))>limit_seconds+5 then
   update public.quiz_attempts set status='interrupted',answers=p_answers,submitted_at=now() where id=a.id;
   insert into public.quiz_attempt_events(attempt_id,event_type) values(a.id,'interrupted');
   raise exception 'Time limit exceeded. This attempt has been invalidated.';
 end if;
 if a.visibility_violations>0 then
   update public.quiz_attempts set status='interrupted',answers=p_answers,submitted_at=now() where id=a.id;
   raise exception 'Quiz invalidated because the quiz page was left';
 end if;
 for x in
   select qq.* from jsonb_array_elements_text(a.question_ids) z(id)
   join public.quiz_questions qq on qq.id=z.id::uuid
 loop
   total:=total+x.points;
   ans:=p_answers->>x.id::text;
   if ans=x.correct_option then earned:=earned+x.points; end if;
 end loop;
 if total=0 then raise exception 'Quiz has no questions'; end if;
 score:=round(earned/total*100,2);
 update public.quiz_attempts
 set status='released',submitted_at=now(),released_at=now(),release_at=now(),
     answers=p_answers,score_percent=score,
     pacing_seconds=greatest(coalesce(p_pacing_seconds,0),0)
 where id=a.id;
 insert into public.quiz_attempt_events(attempt_id,event_type) values(a.id,'submitted');
 insert into public.notifications(user_id,title,message)
 values(a.student_id,'Daily quiz graded',q.title||' has been graded. Your result is available now.');
 return jsonb_build_object('attempt_id',a.id,'status','released','score_percent',score,'release_at',now());
end
$fn$;

update public.quizzes set time_limit_minutes=20
where kind='graded' and day_number between 1 and 4;

update public.quizzes set time_limit_minutes=30
where kind='graded' and day_number=5;

-- Keep the daily assessment bank at the intended size.
delete from public.quiz_questions where quiz_id in (select id from public.quizzes where kind='graded' and day_number between 1 and 4) and question_number>15;
delete from public.quiz_questions where quiz_id in (select id from public.quizzes where kind='graded' and day_number=5) and question_number>25;
