-- TAMP performance/RLS cleanup
create index if not exists enrollment_keys_course_id_idx
  on public.enrollment_keys(course_id);
create index if not exists enrollment_keys_redeemed_by_idx
  on public.enrollment_keys(redeemed_by);

drop policy if exists course_levels_admin_write on public.course_levels;
create policy course_levels_admin_insert on public.course_levels
for insert to authenticated
with check ((select private.is_admin()));
create policy course_levels_admin_update on public.course_levels
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy course_levels_admin_delete on public.course_levels
for delete to authenticated
using ((select private.is_admin()));

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_insert on public.site_settings
for insert to authenticated
with check ((select private.is_admin()));
create policy site_settings_admin_update on public.site_settings
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy site_settings_admin_delete on public.site_settings
for delete to authenticated
using ((select private.is_admin()));
