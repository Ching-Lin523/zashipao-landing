-- 不刪除或修改既有預約；從執行後的新預約開始檢查時間重疊。
begin;

create or replace function public.book_session(p_session_id uuid, p_task_ids bigint[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_booking uuid;
  v_ids bigint[];
  v_count integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  -- 同一帳號的預約與取消依序執行，防止跨場次並發檢查同時通過。
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 20261018));
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not v_session.is_published or v_session.starts_at <= clock_timestamp() then
    raise exception 'SESSION_CLOSED';
  end if;
  if exists (select 1 from public.bookings where user_id = v_user and session_id = p_session_id) then
    raise exception 'ALREADY_BOOKED';
  end if;
  -- 半開區間 [start,end)：前一場結束當下可以接下一場。
  if exists (
    select 1 from public.bookings b join public.sessions s on s.id = b.session_id
    where b.user_id = v_user
      and s.starts_at < v_session.ends_at
      and s.ends_at > v_session.starts_at
  ) then raise exception 'BOOKING_TIME_CONFLICT'; end if;
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

create or replace function public.cancel_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_start timestamptz;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  -- 同一帳號的預約與取消依序執行，防止跨場次並發檢查同時通過。
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 20261018));
  select session_id into v_session_id from public.bookings where id = p_booking_id and user_id = v_user;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select starts_at into v_start from public.sessions where id = v_session_id for update;
  if v_start <= clock_timestamp() then raise exception 'SESSION_STARTED'; end if;
  delete from public.bookings where id = p_booking_id and user_id = v_user;
end;
$$;

revoke execute on function public.book_session(uuid, bigint[]), public.cancel_booking(uuid) from public, anon, authenticated;
grant execute on function public.book_session(uuid, bigint[]), public.cancel_booking(uuid) to authenticated;
commit;
