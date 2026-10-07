-- TAMP daily assignments, student feedback, profile lock and activity notifications.
alter table public.assignments add column if not exists day_number integer;
alter table public.assignments add column if not exists is_final_project boolean not null default false;
alter table public.assignments drop constraint if exists assignments_day_number_check;
alter table public.assignments add constraint assignments_day_number_check check(day_number is null or day_number between 1 and 5);
create index if not exists assignments_course_week_day_idx on public.assignments(course_id,week_number,day_number);

create table if not exists public.student_feedback(
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.profiles(id) on delete cascade,
 course_id text not null references public.courses(id) on delete cascade,
 journey_number integer,
 day_number integer not null check(day_number between 1 and 5),
 rating integer not null check(rating between 1 and 5),
 comment text not null check(length(trim(comment)) between 3 and 1000),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.student_feedback enable row level security;
drop policy if exists student_feedback_public_select on public.student_feedback;
create policy student_feedback_public_select on public.student_feedback for select using(approved=true or student_id=auth.uid() or private.is_admin());
drop policy if exists student_feedback_student_insert on public.student_feedback;
create policy student_feedback_student_insert on public.student_feedback for insert with check(student_id=auth.uid());
drop policy if exists student_feedback_student_update on public.student_feedback;
create policy student_feedback_student_update on public.student_feedback for update using(student_id=auth.uid() or private.is_admin()) with check(student_id=auth.uid() or private.is_admin());
create index if not exists student_feedback_approved_idx on public.student_feedback(approved,created_at desc);

create or replace function public.submit_daily_feedback(p_course_id text,p_journey_number integer,p_day_number integer,p_rating integer,p_comment text)
returns public.student_feedback language plpgsql security definer set search_path=public,pg_temp
as $function$
declare v public.student_feedback;
begin
 if auth.uid() is null then raise exception 'You must be signed in.' using errcode='42501'; end if;
 if not exists(select 1 from public.enrollments where user_id=auth.uid() and course_id=p_course_id and status in('active','completed'))
 then raise exception 'You are not enrolled in this course.' using errcode='42501'; end if;
 insert into public.student_feedback(student_id,course_id,journey_number,day_number,rating,comment)
 values(auth.uid(),p_course_id,p_journey_number,p_day_number,p_rating,trim(p_comment))
 on conflict do nothing returning * into v;
 if v.id is null then
   select * into v from public.student_feedback where student_id=auth.uid() and course_id=p_course_id
   and journey_number is not distinct from p_journey_number and day_number=p_day_number order by created_at desc limit 1;
 end if;
 return v;
end $function$;
revoke execute on function public.submit_daily_feedback(text,integer,integer,integer,text) from public,anon;
grant execute on function public.submit_daily_feedback(text,integer,integer,integer,text) to authenticated;

create or replace function public.complete_my_enrollment_profile(p_full_name text,p_phone text,p_date_of_birth date,p_gender text,p_country text,p_state_region text,p_city text,p_address text,p_education_level text,p_institution text,p_emergency_contact_name text,p_emergency_contact_phone text)
returns public.profiles language plpgsql security definer set search_path=public,pg_temp
as $function$
declare v public.profiles;
begin
 if auth.uid() is null then raise exception 'You must be signed in.' using errcode='42501'; end if;
 select * into v from public.profiles where id=auth.uid() for update;
 if not found then raise exception 'Student profile not found.'; end if;
 if v.role<>'admin' and now()>=v.created_at+interval '10 days' then raise exception 'Use the normal profile editor after the 10-day account period.'; end if;
 if exists(select 1 from public.enrollments where user_id=auth.uid() and course_id='da') then raise exception 'Your enrollment profile has already been submitted.'; end if;
 update public.profiles set full_name=trim(p_full_name),phone=p_phone,date_of_birth=p_date_of_birth,gender=p_gender,country=p_country,state_region=p_state_region,city=p_city,address=p_address,education_level=p_education_level,institution=p_institution,emergency_contact_name=p_emergency_contact_name,emergency_contact_phone=p_emergency_contact_phone,updated_at=now() where id=auth.uid() returning * into v;
 return v;
end $function$;
revoke execute on function public.complete_my_enrollment_profile(text,text,date,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.complete_my_enrollment_profile(text,text,date,text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.update_my_profile(p_full_name text,p_phone text,p_date_of_birth date,p_gender text,p_country text,p_state_region text,p_city text,p_address text,p_education_level text,p_institution text,p_emergency_contact_name text,p_emergency_contact_phone text)
returns public.profiles language plpgsql security definer set search_path=public,pg_temp
as $function$
declare v public.profiles;
begin
 if auth.uid() is null then raise exception 'You must be signed in.' using errcode='42501'; end if;
 select * into v from public.profiles where id=auth.uid() for update;
 if not found then raise exception 'Student profile not found.'; end if;
 if v.role<>'admin' and now()<v.created_at+interval '10 days' then raise exception 'Profile editing becomes available 10 days after your TAMP account was created.'; end if;
 update public.profiles set full_name=trim(coalesce(p_full_name,full_name)),phone=p_phone,date_of_birth=p_date_of_birth,gender=p_gender,country=p_country,state_region=p_state_region,city=p_city,address=p_address,education_level=p_education_level,institution=p_institution,emergency_contact_name=p_emergency_contact_name,emergency_contact_phone=p_emergency_contact_phone,updated_at=now() where id=auth.uid() returning * into v;
 return v;
end $function$;
revoke execute on function public.update_my_profile(text,text,date,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.update_my_profile(text,text,date,text,text,text,text,text,text,text,text,text) to authenticated;

update public.assignments set day_number=5 where course_id='da' and week_number in(1,2,3) and day_number is null;
update public.assignments set title='Day 5 — Mini Analysis Brief',description='Bring the week together: define the purpose, state the question, identify the evidence, explain the method and give a short decision-oriented conclusion.',submission_instructions='Submit a concise analysis brief. This is the final Beginner Journey 1 assignment and should show your complete reasoning chain.' where course_id='da' and week_number=1 and day_number=5;
update public.assignments set title='Day 5 — Analysis Checkpoint',description='Combine the week’s work into a compact analysis checkpoint with data preparation, a finding and a recommendation.',submission_instructions='Submit the completed checkpoint as a notebook, PDF, DOCX or URL.' where course_id='da' and week_number=2 and day_number=5;
update public.assignments set title='Day 5 — Beginner Capstone Submission',description='Submit the complete Beginner capstone package: question, data, method, analysis, visuals, findings and recommendations.',submission_instructions='Submit the final Beginner capstone. This is reviewed as the major practical assessment before progression.' where course_id='da' and week_number=3 and day_number=5;

insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 1 — Identify the Data','Choose a small real-world dataset or information source. Identify what each field represents and distinguish qualitative and quantitative data.',1,1,'2026-10-21 23:59:59+00',100,true,'Submit a short response as PDF, DOCX, image, text or URL. Include the source, at least five example values, and label the data types you identified.',false
where not exists(select 1 from public.assignments where course_id='da' and week_number=1 and day_number=1);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 2 — Ask a Better Question','Turn a real situation into one clear analytical question that could be answered with evidence.',1,2,'2026-10-22 23:59:59+00',100,true,'Submit your analytical question and explain what decision it could support. Include the data you would need to answer it.',false
where not exists(select 1 from public.assignments where course_id='da' and week_number=1 and day_number=2);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 3 — Choose the Strategy','Select the most suitable beginner analysis strategy for your question: visualization, exploratory analysis, trend analysis or estimation.',1,3,'2026-10-23 23:59:59+00',100,true,'Explain the strategy you selected, why it fits the question, and what result you expect the analysis to reveal.',false
where not exists(select 1 from public.assignments where course_id='da' and week_number=1 and day_number=3);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 4 — Build Simple Evidence','Create one simple table or chart from your chosen data and explain the pattern it shows.',1,4,'2026-10-24 23:59:59+00',100,true,'Submit the table or chart plus a short interpretation. A spreadsheet screenshot, PDF, image or URL is acceptable.',false
where not exists(select 1 from public.assignments where course_id='da' and week_number=1 and day_number=4);

insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 1 — Python Setup Check','Prepare a clean Python/Jupyter working environment and document the tools you will use for analysis.',2,1,'2026-10-26 23:59:59+00',100,true,'Submit a screenshot or short document showing your working environment and a simple successful Python run.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=2 and day_number=1);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 2 — Load and Inspect','Load a small dataset and record its basic structure, fields and obvious quality issues.',2,2,'2026-10-27 23:59:59+00',100,true,'Submit your notebook, code file, URL or PDF showing the dataset inspection and your observations.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=2 and day_number=2);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 3 — Clean and Group','Demonstrate a simple cleaning step and one grouping or aggregation that reveals a useful pattern.',2,3,'2026-10-28 23:59:59+00',100,true,'Submit the code or notebook and a short explanation of what changed and what the grouped result tells you.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=2 and day_number=3);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 4 — Visualize Findings','Create a clear chart and explain what a reader should notice first.',2,4,'2026-10-29 23:59:59+00',100,true,'Submit the chart and a short interpretation. Prioritize clarity over decoration.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=2 and day_number=4);

insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 1 — Define the Business Problem','Translate a practical business situation into a measurable question and identify the KPI that would help answer it.',3,1,'2026-10-31 23:59:59+00',100,true,'Submit the problem statement, KPI definition and required evidence.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=3 and day_number=1);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 2 — Validate the Analysis','Review your analytical approach for missing data, misleading comparisons or unsupported conclusions.',3,2,'2026-11-01 23:59:59+00',100,true,'Submit a validation checklist and explain at least two checks you performed.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=3 and day_number=2);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 3 — Nigerian Sales Analysis','Apply the course workflow to the Nigerian/business sales dataset and identify meaningful performance patterns.',3,3,'2026-11-02 23:59:59+00',100,true,'Submit the analysis notebook/report with evidence supporting each major finding.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=3 and day_number=3);
insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Day 4 — Recommendations','Turn the evidence into practical recommendations and clearly connect each recommendation to a finding.',3,4,'2026-11-03 23:59:59+00',100,true,'Submit your recommendations with the evidence that supports each one.',false)
where not exists(select 1 from public.assignments where course_id='da' and week_number=3 and day_number=4);

insert into public.assignments(course_id,title,description,week_number,day_number,due_at,max_score,allow_resubmission,submission_instructions,is_final_project)
select 'da','Final Week Project — TAMP Data Analysis Capstone','A final project used to assess the learner’s end-to-end analytical ability and supply the verified course-completion information used for certificate records.',null,null,null,100,true,'Locked until the final project window is configured by TAMP administration.',true)
where not exists(select 1 from public.assignments where course_id='da' and is_final_project=true);

create or replace function public.notify_user(p_user_id uuid,p_title text,p_message text)
returns void language plpgsql security definer set search_path=public,pg_temp as $function$
begin insert into public.notifications(user_id,title,message) values(p_user_id,p_title,p_message); end $function$;
revoke execute on function public.notify_user(uuid,text,text) from public,anon,authenticated;

create or replace function public.notify_enrollment_event()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $function$
begin perform public.notify_user(new.user_id,case when new.status='active' then 'Course access unlocked' else 'Enrollment received' end,case when new.status='active' then 'Your Data Analysis course access is now active. Your next available lesson and assignment are ready.' else 'Your Data Analysis enrollment was received. We are preparing your course access.' end); return new; end $function$;
revoke execute on function public.notify_enrollment_event() from public,anon,authenticated;
drop trigger if exists trg_notify_enrollment on public.enrollments;
create trigger trg_notify_enrollment after insert or update of status on public.enrollments for each row execute function public.notify_enrollment_event();

create or replace function public.notify_submission_event()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $function$
begin
 if tg_op='INSERT' then perform public.notify_user(new.student_id,'Assignment submitted','Your assignment has been received and is waiting for review.');
 elsif new.status is distinct from old.status and new.status in('graded','published','returned') then
   perform public.notify_user(new.student_id,case when new.status='returned' then 'Assignment returned' else 'Assignment result updated' end,case when new.status='returned' then 'Your assignment was returned for another look. Check the assignment feedback.' else 'Your assignment result is available. Open your learning space to review the result and feedback.' end);
 end if; return new;
end $function$;
revoke execute on function public.notify_submission_event() from public,anon,authenticated;
drop trigger if exists trg_notify_submission on public.submissions;
create trigger trg_notify_submission after insert or update of status on public.submissions for each row execute function public.notify_submission_event();

create or replace function public.notify_certificate_event()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $function$
begin perform public.notify_user(new.student_id,'Certificate issued','Your TAMP certificate has been issued and is ready to view and verify.'); return new; end $function$;
revoke execute on function public.notify_certificate_event() from public,anon,authenticated;
drop trigger if exists trg_notify_certificate on public.certificates;
create trigger trg_notify_certificate after insert on public.certificates for each row execute function public.notify_certificate_event();
