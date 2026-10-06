-- TAMP assessment architecture
-- Beginner is the current course phase. Each journey is a five-day window.
-- This migration is intentionally content-extensible: Intermediate and Advanced
-- can be added later without creating new courses.

alter table public.course_levels drop constraint if exists course_levels_level_number_check;
alter table public.course_levels add column if not exists phase text not null default 'beginner';
alter table public.course_levels add column if not exists journey_number integer;
update public.course_levels set journey_number=level_number where journey_number is null;
alter table public.course_levels alter column journey_number set not null;
alter table public.course_levels add constraint course_levels_phase_check check(phase in('beginner','intermediate','advanced'));
alter table public.course_levels add constraint course_levels_journey_number_check check(journey_number>=1);

create index if not exists course_levels_course_phase_journey_idx
on public.course_levels(course_id,phase,journey_number);

create table if not exists public.quizzes(
 id uuid primary key default gen_random_uuid(),
 course_id text not null references public.courses(id) on delete cascade,
 course_level_id uuid not null references public.course_levels(id) on delete cascade,
 title text not null,
 kind text not null check(kind in('practice','graded')),
 instructions text not null default '',
 time_limit_minutes integer check(time_limit_minutes is null or time_limit_minutes>0),
 release_delay_hours integer not null default 24 check(release_delay_hours>=0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions(
 id uuid primary key default gen_random_uuid(),
 quiz_id uuid not null references public.quizzes(id) on delete cascade,
 question_number integer not null,
 prompt text not null,
 question_type text not null default 'single_choice' check(question_type='single_choice'),
 options jsonb not null default '[]'::jsonb,
 correct_option text,
 points numeric not null default 1 check(points>0),
 explanation text,
 created_at timestamptz not null default now(),
 unique(quiz_id,question_number)
);

create table if not exists public.quiz_attempts(
 id uuid primary key default gen_random_uuid(),
 quiz_id uuid not null references public.quizzes(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 started_at timestamptz not null default now(),
 last_heartbeat_at timestamptz not null default now(),
 submitted_at timestamptz,
 release_at timestamptz,
 released_at timestamptz,
 status text not null default 'in_progress' check(status in('in_progress','interrupted','submitted_pending','released','void')),
 score_percent numeric(5,2) check(score_percent is null or(score_percent>=0 and score_percent<=100)),
 answers jsonb not null default '{}'::jsonb,
 visibility_violations integer not null default 0 check(visibility_violations>=0),
 pacing_seconds integer check(pacing_seconds is null or pacing_seconds>=0),
 created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_student_status_idx on public.quiz_attempts(student_id,status,release_at);

create table if not exists public.quiz_attempt_events(
 id uuid primary key default gen_random_uuid(),
 attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
 event_type text not null check(event_type in('started','heartbeat','hidden','visible','pagehide','beforeunload','submitted','interrupted')),
 created_at timestamptz not null default now()
);

create index if not exists quiz_attempt_events_attempt_idx on public.quiz_attempt_events(attempt_id,created_at);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_events enable row level security;

drop policy if exists quizzes_student_select on public.quizzes;
create policy quizzes_student_select on public.quizzes for select to authenticated using(
 active and exists(select 1 from public.enrollments e where e.user_id=(select auth.uid()) and e.course_id=quizzes.course_id and e.status='active')
);

drop policy if exists quiz_questions_student_select on public.quiz_questions;

drop policy if exists quiz_attempts_student_select on public.quiz_attempts;
create policy quiz_attempts_student_select on public.quiz_attempts for select to authenticated using(student_id=(select auth.uid()));

drop policy if exists quiz_attempt_events_student_select on public.quiz_attempt_events;
create policy quiz_attempt_events_student_select on public.quiz_attempt_events for select to authenticated using(
 exists(select 1 from public.quiz_attempts a where a.id=quiz_attempt_events.attempt_id and a.student_id=(select auth.uid()))
);

drop policy if exists quizzes_admin_all on public.quizzes;
create policy quizzes_admin_all on public.quizzes for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

drop policy if exists quiz_questions_admin_all on public.quiz_questions;
create policy quiz_questions_admin_all on public.quiz_questions for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

drop policy if exists quiz_attempts_admin_select on public.quiz_attempts;
create policy quiz_attempts_admin_select on public.quiz_attempts for select to authenticated using((select public.is_admin()));

drop policy if exists quiz_attempt_events_admin_select on public.quiz_attempt_events;
create policy quiz_attempt_events_admin_select on public.quiz_attempt_events for select to authenticated using((select public.is_admin()));

-- The public student API returns questions without correct answers.
-- Server-side RPCs calculate the score and release the official result after 24 hours.
