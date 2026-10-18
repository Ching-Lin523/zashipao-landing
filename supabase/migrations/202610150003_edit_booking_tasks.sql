begin;

-- 更新本場待辦，不建立或刪除預約，因此不改變名額。
create or replace function public.update_booking_tasks(p_booking_id uuid, p_task_ids bigint[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_start timestamptz;
  v_ids bigint[];
  v_count integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select session_id into v_session_id from public.bookings
    where id = p_booking_id and user_id = v_user;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;

  -- 與預約／取消共用鎖定順序，避免同時取消與編輯。
  select starts_at into v_start from public.sessions where id = v_session_id for update;
  if v_start <= clock_timestamp() then raise exception 'SESSION_STARTED'; end if;
  perform id from public.bookings where id = p_booking_id and user_id = v_user for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;

  select array_agg(distinct item) into v_ids from unnest(p_task_ids) as item where item is not null;
  if coalesce(cardinality(v_ids), 0) = 0 then raise exception 'TASKS_REQUIRED'; end if;
  perform id from public.tasks where user_id = v_user and id = any(v_ids) order by id for update;
  select count(*) into v_count from public.tasks
    where user_id = v_user and id = any(v_ids) and not completed and not archived;
  if v_count <> cardinality(v_ids) then raise exception 'INVALID_TASKS'; end if;

  delete from public.booking_tasks where booking_id = p_booking_id and user_id = v_user;
  insert into public.booking_tasks(booking_id, user_id, task_id)
    select p_booking_id, v_user, item from unnest(v_ids) as item;
end;
$$;

revoke execute on function public.update_booking_tasks(uuid, bigint[]) from public, anon, authenticated;
grant execute on function public.update_booking_tasks(uuid, bigint[]) to authenticated;
commit;
