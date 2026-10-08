create extension if not exists pgcrypto;

create table if not exists public.course_readings (
 id uuid primary key default gen_random_uuid(),
 course_id text not null references public.courses(id) on delete cascade,
 course_level_id uuid not null references public.course_levels(id) on delete cascade,
 journey_number integer not null,
 day_number integer not null,
 slug text not null,
 title text not null,
 estimated_minutes integer not null default 30,
 attribution text not null default 'TAMP Curriculum Team',
 current_version_id uuid null,
 created_by uuid null references auth.users(id),
 updated_by uuid null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(course_level_id,day_number)
);

create table if not exists public.course_reading_versions (
 id uuid primary key default gen_random_uuid(),
 reading_id uuid not null references public.course_readings(id) on delete cascade,
 version_number integer not null,
 status text not null default 'draft' check(status in ('draft','review','published','archived')),
 intro text not null default '',
 sections jsonb not null default '[]'::jsonb,
 videos jsonb not null default '[]'::jsonb,
 attribution text not null default 'TAMP Curriculum Team',
 editor_note text,
 created_by uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 unique(reading_id,version_number)
);

create table if not exists public.course_instructors (
 id uuid primary key default gen_random_uuid(),
 course_id text not null references public.courses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'active' check(status in ('active','revoked')),
 assigned_by uuid references auth.users(id),
 assigned_at timestamptz not null default now(),
 unique(course_id,user_id)
);

create table if not exists public.course_reading_revisions (
 id uuid primary key default gen_random_uuid(),
 reading_id uuid not null references public.course_readings(id) on delete cascade,
 version_id uuid references public.course_reading_versions(id) on delete set null,
 action text not null,
 snapshot jsonb not null,
 actor_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);

create index if not exists idx_course_readings_lookup on public.course_readings(course_id,course_level_id,journey_number,day_number);
create index if not exists idx_reading_versions_status on public.course_reading_versions(reading_id,status);
create index if not exists idx_course_instructors_user on public.course_instructors(user_id,course_id);

create or replace function public.tamp_is_admin()
returns boolean language sql security definer set search_path=public,auth stable as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;

create or replace function public.tamp_is_course_instructor(p_course_id text)
returns boolean language sql security definer set search_path=public,auth stable as $$
 select public.tamp_is_admin() or exists(
   select 1 from public.course_instructors ci
   where ci.course_id=p_course_id and ci.user_id=auth.uid() and ci.status='active'
 );
$$;

alter table public.course_readings enable row level security;
alter table public.course_reading_versions enable row level security;
alter table public.course_instructors enable row level security;
alter table public.course_reading_revisions enable row level security;

drop policy if exists "read course readings" on public.course_readings;
create policy "read course readings" on public.course_readings for select to authenticated using (true);
drop policy if exists "staff manage course readings" on public.course_readings;
create policy "staff manage course readings" on public.course_readings for all to authenticated using (public.tamp_is_course_instructor(course_id)) with check (public.tamp_is_course_instructor(course_id));

drop policy if exists "read reading versions" on public.course_reading_versions;
create policy "read reading versions" on public.course_reading_versions for select to authenticated using (status='published' or public.tamp_is_course_instructor((select cr.course_id from public.course_readings cr where cr.id=reading_id)));
drop policy if exists "instructors create versions" on public.course_reading_versions;
create policy "instructors create versions" on public.course_reading_versions for insert to authenticated with check (public.tamp_is_course_instructor((select cr.course_id from public.course_readings cr where cr.id=reading_id)) and created_by=auth.uid() and status in ('draft','review'));
drop policy if exists "instructors update versions" on public.course_reading_versions;
create policy "instructors update versions" on public.course_reading_versions for update to authenticated using (public.tamp_is_course_instructor((select cr.course_id from public.course_readings cr where cr.id=reading_id))) with check (public.tamp_is_course_instructor((select cr.course_id from public.course_readings cr where cr.id=reading_id)) and (status in ('draft','review') or public.tamp_is_admin()));

drop policy if exists "admin manage instructors" on public.course_instructors;
create policy "admin manage instructors" on public.course_instructors for all to authenticated using (public.tamp_is_admin()) with check (public.tamp_is_admin());
drop policy if exists "instructor see own assignment" on public.course_instructors;
create policy "instructor see own assignment" on public.course_instructors for select to authenticated using (user_id=auth.uid());

drop policy if exists "staff read revisions" on public.course_reading_revisions;
create policy "staff read revisions" on public.course_reading_revisions for select to authenticated using (public.tamp_is_course_instructor((select cr.course_id from public.course_readings cr where cr.id=reading_id)));

create or replace function public.admin_publish_reading_version(p_version_id uuid)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_reading uuid;
begin
 if not public.tamp_is_admin() then raise exception 'Administrator access required'; end if;
 select reading_id into v_reading from public.course_reading_versions where id=p_version_id;
 if v_reading is null then raise exception 'Reading version not found'; end if;
 update public.course_reading_versions set status='archived',updated_at=now() where reading_id=v_reading and status='published';
 update public.course_reading_versions set status='published',published_at=now(),updated_at=now() where id=p_version_id;
 update public.course_readings set current_version_id=p_version_id,updated_by=auth.uid(),updated_at=now() where id=v_reading;
 return p_version_id;
end $$;

create or replace function public.admin_set_course_instructor(p_email text,p_course_id text,p_active boolean default true)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare uid uuid;
begin
 if not public.tamp_is_admin() then raise exception 'Administrator access required'; end if;
 select id into uid from auth.users where lower(email)=lower(trim(p_email)) limit 1;
 if uid is null then raise exception 'No TAMP account found for that email'; end if;
 insert into public.profiles(id,role) values(uid,case when p_active then 'instructor' else 'student' end)
 on conflict(id) do update set role=case when p_active then 'instructor' else public.profiles.role end,updated_at=now();
 insert into public.course_instructors(course_id,user_id,status,assigned_by) values(p_course_id,uid,case when p_active then 'active' else 'revoked' end,auth.uid())
 on conflict(course_id,user_id) do update set status=excluded.status,assigned_by=auth.uid(),assigned_at=now();
 return uid;
end $$;

create or replace function public.save_instructor_reading(p_reading_id uuid,p_intro text,p_sections jsonb,p_videos jsonb,p_editor_note text default null,p_status text default 'review')
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_course text; v_version integer; v_id uuid;
begin
 select course_id into v_course from public.course_readings where id=p_reading_id;
 if v_course is null or not public.tamp_is_course_instructor(v_course) then raise exception 'Instructor access required'; end if;
 if p_status not in ('draft','review') then raise exception 'Instructors may only save draft or review versions'; end if;
 select coalesce(max(version_number),0)+1 into v_version from public.course_reading_versions where reading_id=p_reading_id;
 insert into public.course_reading_versions(reading_id,version_number,status,intro,sections,videos,attribution,editor_note,created_by,updated_by)
 values(p_reading_id,v_version,p_status,coalesce(p_intro,''),coalesce(p_sections,'[]'::jsonb),coalesce(p_videos,'[]'::jsonb),'TAMP Curriculum Team',p_editor_note,auth.uid(),auth.uid()) returning id into v_id;
 insert into public.course_reading_revisions(reading_id,version_id,action,snapshot,actor_id)
 values(p_reading_id,v_id,'submitted',jsonb_build_object('intro',p_intro,'sections',p_sections,'videos',p_videos,'editor_note',p_editor_note),auth.uid());
 return v_id;
end $$;

create or replace function public.get_instructor_reading(p_reading_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_course text; v_live jsonb; v_draft jsonb;
begin
 select course_id into v_course from public.course_readings where id=p_reading_id;
 if v_course is null or not public.tamp_is_course_instructor(v_course) then raise exception 'Instructor access required'; end if;
 select jsonb_build_object('id',id,'version_number',version_number,'status',status,'intro',intro,'sections',sections,'videos',videos,'attribution',attribution,'editor_note',editor_note)
 into v_live from public.course_reading_versions where reading_id=p_reading_id and status='published' order by version_number desc limit 1;
 select jsonb_build_object('id',id,'version_number',version_number,'status',status,'intro',intro,'sections',sections,'videos',videos,'attribution',attribution,'editor_note',editor_note)
 into v_draft from public.course_reading_versions where reading_id=p_reading_id and status in ('draft','review') order by version_number desc limit 1;
 return jsonb_build_object('live',v_live,'draft',v_draft);
end $$;

grant execute on function public.tamp_is_admin() to authenticated;
grant execute on function public.tamp_is_course_instructor(text) to authenticated;
grant execute on function public.admin_publish_reading_version(uuid) to authenticated;
grant execute on function public.admin_set_course_instructor(text,text,boolean) to authenticated;
grant execute on function public.save_instructor_reading(uuid,text,jsonb,jsonb,text,text) to authenticated;
grant execute on function public.get_instructor_reading(uuid) to authenticated;