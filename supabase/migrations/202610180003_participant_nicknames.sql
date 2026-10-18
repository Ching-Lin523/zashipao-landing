-- 暱稱只用於顯示，不作為權限或身分判斷。
begin;
create or replace function public.my_session_display_name(p_session_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(left(btrim(u.raw_user_meta_data ->> 'nickname'), 24), ''), '夥伴 ' || b.position)
  from (select user_id, row_number() over (order by created_at, id) as position
    from public.bookings where session_id = p_session_id) b
  join auth.users u on u.id = b.user_id
  where b.user_id = auth.uid();
$$;
revoke execute on function public.my_session_display_name(uuid) from public, anon, authenticated;

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
  return jsonb_build_object('display_name', public.my_session_display_name(p_session_id), 'id', v_session.id, 'title', v_session.title, 'starts_at', v_session.starts_at,
    'finished_at', (select finished_at from public.session_results where booking_id = v_booking), 'ends_at', v_session.ends_at, 'server_time', v_now, 'tasks', v_tasks);
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
    'member_id', member_id, 'label', coalesce(nullif(left(btrim(nickname), 24), ''), '夥伴 ' || position), 'is_self', user_id = v_user
  ) order by position), '[]'::jsonb) into v_members
  from (
    select b.id as member_id, b.user_id, u.raw_user_meta_data ->> 'nickname' as nickname,
      row_number() over (order by b.created_at, b.id) as position,
      exists(select 1 from public.room_presence p where p.session_id = b.session_id and p.user_id = b.user_id
        and p.last_seen > clock_timestamp() - interval '60 seconds') as online
    from public.bookings b join auth.users u on u.id = b.user_id where b.session_id = p_session_id
  ) members where online;
  return jsonb_build_object('members', v_members, 'capacity', v_session.capacity);
end;
$$;
commit;
