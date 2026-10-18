-- 執行一次：只結束自己的參與，不改全場時間或其他人的紀錄。
begin;
alter table public.session_results add column finished_at timestamptz;

create or replace function public.track_result_schedule() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.session_results set title = new.title, starts_at = new.starts_at, ends_at = new.ends_at
    where session_id = new.id and finished_at is null and ends_at > clock_timestamp();
  return new;
end;
$$;

create or replace function public.track_result_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.session_result_tasks rt using public.session_results r
      where rt.booking_id = old.booking_id and rt.task_id = old.task_id
        and r.booking_id = rt.booking_id and r.finished_at is null and r.ends_at > clock_timestamp();
    return old;
  end if;
  insert into public.session_result_tasks(booking_id, task_id, title, completed)
    select new.booking_id, t.id, t.title, t.completed from public.tasks t
    join public.session_results r on r.booking_id = new.booking_id
    where t.user_id = new.user_id and t.id = new.task_id and r.finished_at is null and r.ends_at > clock_timestamp()
    on conflict (booking_id, task_id) do update set title = excluded.title, completed = excluded.completed;
  return new;
end;
$$;

create or replace function public.track_result_task() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.session_result_tasks rt set title = new.title, completed = new.completed
    from public.session_results r where r.booking_id = rt.booking_id
      and r.user_id = new.user_id and rt.task_id = new.id and r.finished_at is null and r.ends_at > clock_timestamp();
  return new;
end;
$$;

create or replace function public.get_session_result(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_result public.session_results%rowtype;
  v_tasks jsonb;
  v_completed integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.bookings where session_id = p_session_id and user_id = v_user) then
    raise exception 'BOOKING_REQUIRED';
  end if;
  select * into v_result from public.session_results where session_id = p_session_id and user_id = v_user;
  if not found then raise exception 'RESULT_UNAVAILABLE'; end if;
  if v_result.finished_at is null and clock_timestamp() < v_result.ends_at then raise exception 'SESSION_NOT_ENDED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', task_id, 'title', title, 'completed', completed) order by task_id), '[]'::jsonb),
    count(*) filter (where completed) into v_tasks, v_completed
    from public.session_result_tasks where booking_id = v_result.booking_id;
  return jsonb_build_object('session_id', v_result.session_id, 'title', v_result.title,
    'starts_at', v_result.starts_at, 'ends_at', v_result.ends_at, 'tracking_started_at', v_result.tracking_started_at, 'finished_at', v_result.finished_at,
    'tasks', v_tasks, 'total_count', jsonb_array_length(v_tasks), 'completed_count', v_completed);
end;
$$;

create function public.finish_my_session(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_result public.session_results%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  -- 與房間更新採同樣順序鎖定：場次、待辦、成果。
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not exists (select 1 from public.bookings where session_id = p_session_id and user_id = v_user) then
    raise exception 'BOOKING_REQUIRED';
  end if;
  if clock_timestamp() < v_session.starts_at then raise exception 'SESSION_NOT_STARTED'; end if;
  perform t.id from public.tasks t join public.booking_tasks bt on bt.user_id=t.user_id and bt.task_id=t.id
    join public.bookings b on b.id=bt.booking_id
    where b.session_id=p_session_id and b.user_id=v_user order by t.id for update of t;
  select * into v_result from public.session_results where session_id=p_session_id and user_id=v_user for update;
  if not found then raise exception 'RESULT_UNAVAILABLE'; end if;
  if v_result.finished_at is null and clock_timestamp() < v_result.ends_at then
    update public.session_results set finished_at=clock_timestamp() where booking_id=v_result.booking_id;
  end if;
  delete from public.room_presence where session_id=p_session_id and user_id=v_user;
  return public.get_session_result(p_session_id);
end;
$$;
revoke execute on function public.finish_my_session(uuid) from public, anon, authenticated;
grant execute on function public.finish_my_session(uuid) to authenticated;

create or replace function public.get_session_room(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_booking uuid;
  v_now timestamptz := clock_timestamp();
  v_tasks jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  select id into v_booking from public.bookings where user_id = v_user and session_id = p_session_id;
  if not found then raise exception 'BOOKING_REQUIRED'; end if;
  if not v_session.is_published then raise exception 'SESSION_CLOSED'; end if;
  if v_now < v_session.starts_at then raise exception 'SESSION_NOT_STARTED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'completed', t.completed) order by t.id), '[]'::jsonb)
    into v_tasks from public.booking_tasks bt join public.tasks t on t.user_id = bt.user_id and t.id = bt.task_id
    where bt.booking_id = v_booking and bt.user_id = v_user;
  return jsonb_build_object('id', v_session.id, 'title', v_session.title, 'starts_at', v_session.starts_at,
    'finished_at', (select finished_at from public.session_results where booking_id = v_booking), 'ends_at', v_session.ends_at, 'server_time', v_now, 'tasks', v_tasks);
end;
$$;

create or replace function public.set_room_task_completed(p_session_id uuid, p_task_id bigint, p_completed boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_booking uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_completed is null then raise exception 'INVALID_STATE'; end if;
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not v_session.is_published then raise exception 'SESSION_CLOSED'; end if;
  if clock_timestamp() < v_session.starts_at then raise exception 'SESSION_NOT_STARTED'; end if;
  if clock_timestamp() >= v_session.ends_at then raise exception 'SESSION_ENDED'; end if;
  select id into v_booking from public.bookings where user_id = v_user and session_id = p_session_id;
  if not found then raise exception 'BOOKING_REQUIRED'; end if;
  if exists (select 1 from public.session_results where booking_id = v_booking and finished_at is not null) then raise exception 'PARTICIPATION_ENDED'; end if;
  if not exists (select 1 from public.booking_tasks where booking_id = v_booking and user_id = v_user and task_id = p_task_id) then
    raise exception 'INVALID_TASKS';
  end if;
  update public.tasks set completed = p_completed where user_id = v_user and id = p_task_id;
  if not found then raise exception 'INVALID_TASKS'; end if;
end;
$$;

create or replace function public.get_waiting_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_booking uuid;
  v_now timestamptz := clock_timestamp();
  v_tasks jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  select id into v_booking from public.bookings where session_id = p_session_id and user_id = v_user;
  if not found then raise exception 'BOOKING_REQUIRED'; end if;
  if exists (select 1 from public.session_results where booking_id = v_booking and finished_at is not null) then raise exception 'PARTICIPATION_ENDED'; end if;
  if not v_session.is_published then raise exception 'SESSION_CLOSED'; end if;
  if v_now < v_session.starts_at - interval '5 minutes' then raise exception 'WAITING_NOT_OPEN'; end if;
  if v_now >= v_session.ends_at then raise exception 'SESSION_ENDED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'completed', t.completed) order by t.id), '[]'::jsonb)
    into v_tasks from public.booking_tasks bt join public.tasks t on t.user_id = bt.user_id and t.id = bt.task_id
    where bt.booking_id = v_booking and bt.user_id = v_user;
  return jsonb_build_object('id', v_session.id, 'title', v_session.title,
    'starts_at', v_session.starts_at, 'ends_at', v_session.ends_at,
    'server_time', v_now, 'tasks', v_tasks);
end;
$$;

create or replace function public.room_presence_heartbeat(p_session_id uuid, p_tab_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_members jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_tab_id is null then raise exception 'INVALID_TAB'; end if;
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not v_session.is_published or clock_timestamp() < v_session.starts_at - interval '5 minutes'
    or clock_timestamp() >= v_session.ends_at then raise exception 'PRESENCE_CLOSED'; end if;
  if not exists(select 1 from public.bookings where session_id = p_session_id and user_id = v_user) then
    raise exception 'BOOKING_REQUIRED';
  end if;
  if exists (select 1 from public.session_results where session_id=p_session_id and user_id=v_user and finished_at is not null) then raise exception 'PARTICIPATION_ENDED'; end if;
  delete from public.room_presence where session_id = p_session_id and last_seen < clock_timestamp() - interval '60 seconds';
  insert into public.room_presence(session_id, user_id, tab_id, last_seen)
    values(p_session_id, v_user, p_tab_id, clock_timestamp())
    on conflict(session_id,user_id,tab_id) do update set last_seen = excluded.last_seen;
  -- 僅回傳場內代號，不洩露 Email、待辦或其他個人資料。
  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id', member_id, 'label', '夥伴 ' || position, 'is_self', user_id = v_user
  ) order by position), '[]'::jsonb) into v_members
  from (
    select b.id as member_id, b.user_id,
      row_number() over (order by b.created_at, b.id) as position,
      exists(select 1 from public.room_presence p where p.session_id = b.session_id and p.user_id = b.user_id
        and p.last_seen > clock_timestamp() - interval '60 seconds') as online
    from public.bookings b where b.session_id = p_session_id
  ) members where online;
  return jsonb_build_object('members', v_members, 'capacity', v_session.capacity);
end;
$$;

commit;
