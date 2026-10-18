begin;
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
    'ends_at', v_session.ends_at, 'server_time', v_now, 'tasks', v_tasks);
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
  if not exists (select 1 from public.booking_tasks where booking_id = v_booking and user_id = v_user and task_id = p_task_id) then
    raise exception 'INVALID_TASKS';
  end if;
  update public.tasks set completed = p_completed where user_id = v_user and id = p_task_id;
  if not found then raise exception 'INVALID_TASKS'; end if;
end;
$$;
revoke execute on function public.get_session_room(uuid) from public, anon, authenticated;
revoke execute on function public.set_room_task_completed(uuid, bigint, boolean) from public, anon, authenticated;
grant execute on function public.get_session_room(uuid) to authenticated;
grant execute on function public.set_room_task_completed(uuid, bigint, boolean) to authenticated;
commit;
