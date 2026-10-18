begin;
-- 僅已預約者可在開場前五分鐘至結束前讀取等候區。
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
revoke execute on function public.get_waiting_session(uuid) from public, anon, authenticated;
grant execute on function public.get_waiting_session(uuid) to authenticated;
commit;
