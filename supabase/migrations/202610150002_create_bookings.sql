-- 執行一次；整份在同一筆交易中完成，不會修改現有待辦或場次。
begin;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id),
  created_at timestamptz not null default now(),
  unique (user_id, session_id),
  unique (id, user_id)
);
create index bookings_session_id_idx on public.bookings(session_id);

create table public.booking_tasks (
  booking_id uuid not null,
  user_id uuid not null,
  task_id bigint not null,
  primary key (booking_id, task_id),
  foreign key (booking_id, user_id) references public.bookings(id, user_id) on delete cascade,
  foreign key (user_id, task_id) references public.tasks(user_id, id) on delete cascade
);
create index booking_tasks_owner_task_idx on public.booking_tasks(user_id, task_id);

alter table public.bookings enable row level security;
alter table public.booking_tasks enable row level security;
revoke all on public.bookings, public.booking_tasks from public, anon, authenticated;
grant select on public.bookings, public.booking_tasks to authenticated;
create policy "Read own bookings" on public.bookings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own booking tasks" on public.booking_tasks
  for select to authenticated using ((select auth.uid()) = user_id);

-- 所有預約寫入均通過函式；鎖定同一場次，逐一確認名額。
create function public.book_session(p_session_id uuid, p_task_ids bigint[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_booking uuid;
  v_ids bigint[];
  v_count integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not v_session.is_published or v_session.starts_at <= clock_timestamp() then
    raise exception 'SESSION_CLOSED';
  end if;
  if exists (select 1 from public.bookings where user_id = v_user and session_id = p_session_id) then
    raise exception 'ALREADY_BOOKED';
  end if;
  if (select count(*) from public.bookings where session_id = p_session_id) >= v_session.capacity then
    raise exception 'SESSION_FULL';
  end if;
  select array_agg(distinct item) into v_ids from unnest(p_task_ids) as item where item is not null;
  if coalesce(cardinality(v_ids), 0) = 0 then raise exception 'TASKS_REQUIRED'; end if;
  -- 鎖定所選待辦，避免檢查後被其他操作刪除或改變狀態。
  perform id from public.tasks where user_id = v_user and id = any(v_ids) order by id for update;
  select count(*) into v_count from public.tasks
    where user_id = v_user and id = any(v_ids) and not completed and not archived;
  if v_count <> cardinality(v_ids) then raise exception 'INVALID_TASKS'; end if;
  insert into public.bookings(user_id, session_id) values (v_user, p_session_id) returning id into v_booking;
  insert into public.booking_tasks(booking_id, user_id, task_id)
    select v_booking, v_user, item from unnest(v_ids) as item;
  return v_booking;
end;
$$;

-- 取消自己的尚未開始場次；刪除後可重新預約。
create function public.cancel_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_start timestamptz;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select session_id into v_session_id from public.bookings where id = p_booking_id and user_id = v_user;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select starts_at into v_start from public.sessions where id = v_session_id for update;
  if v_start <= clock_timestamp() then raise exception 'SESSION_STARTED'; end if;
  delete from public.bookings where id = p_booking_id and user_id = v_user;
end;
$$;

-- 公開回傳場次與總人數，不公開任何人的身分或待辦內容。
create function public.list_available_sessions()
returns table(id uuid, title text, starts_at timestamptz, ends_at timestamptz, capacity integer, booked_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, s.title, s.starts_at, s.ends_at, s.capacity, count(b.id)
  from public.sessions s left join public.bookings b on b.session_id = s.id
  where s.is_published and s.starts_at > now()
  group by s.id order by s.starts_at;
$$;

revoke execute on function public.book_session(uuid, bigint[]) from public, anon, authenticated;
revoke execute on function public.cancel_booking(uuid) from public, anon, authenticated;
revoke execute on function public.list_available_sessions() from public, anon, authenticated;
grant execute on function public.book_session(uuid, bigint[]) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.list_available_sessions() to anon, authenticated;

commit;

select * from public.list_available_sessions();
