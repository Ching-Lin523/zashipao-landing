begin;
create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  weekly_count integer not null check (weekly_count between 1 and 7),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, id)
);
alter table public.weekly_goals enable row level security;
revoke all on public.weekly_goals from anon, authenticated;
grant select, insert, update on public.weekly_goals to authenticated;
create policy "Own weekly goals" on public.weekly_goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.tasks add column weekly_goal_id uuid,
  add column occurrence_week date, add column occurrence_number integer;
alter table public.tasks add constraint task_weekly_goal_fk foreign key(user_id, weekly_goal_id)
  references public.weekly_goals(user_id, id) on delete cascade;
alter table public.tasks add constraint task_occurrence_shape check (
 (weekly_goal_id is null and occurrence_week is null and occurrence_number is null) or
 (weekly_goal_id is not null and occurrence_week is not null and occurrence_number between 1 and 7
  and extract(isodow from occurrence_week) = 1));
create unique index task_weekly_occurrence on public.tasks(user_id,weekly_goal_id,occurrence_week,occurrence_number);
create sequence public.weekly_task_ids start 1000000000000000 maxvalue 9007199254740991;
-- Idempotent and owner-scoped. Only the requested week is generated; past weeks remain intact.
create function public.ensure_weekly_tasks(p_week date) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_current date;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 v_current := date_trunc('week', now() at time zone 'Asia/Taipei')::date;
 if p_week is null or p_week not in (v_current, v_current + 7) then raise exception 'INVALID_WEEK'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
 insert into public.tasks(user_id,id,title,first_noticed,weekly_goal_id,occurrence_week,occurrence_number)
 select v_user,nextval('public.weekly_task_ids'),
   g.title || '｜' || to_char(p_week,'MM/DD') || ' 這週第' || n || '次',
   (now() at time zone 'Asia/Taipei')::date,g.id,p_week,n
 from public.weekly_goals g cross join lateral generate_series(1,g.weekly_count) n
 where g.user_id=v_user and g.active
 and not exists (select 1 from public.tasks t where t.user_id=v_user and t.weekly_goal_id=g.id
   and t.occurrence_week=p_week and t.occurrence_number=n)
 on conflict (user_id,weekly_goal_id,occurrence_week,occurrence_number) do nothing;
end $$;
revoke all on function public.ensure_weekly_tasks(date) from public, anon;
grant execute on function public.ensure_weekly_tasks(date) to authenticated;
commit;
