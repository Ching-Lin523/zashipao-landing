-- 執行一次。只從目前尚未結束的場次開始保存，不推算舊場次成果。
begin;

create table public.session_results (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  tracking_started_at timestamptz not null default clock_timestamp()
);
create table public.session_result_tasks (
  booking_id uuid not null references public.session_results(booking_id) on delete cascade,
  task_id bigint not null,
  title text not null,
  completed boolean not null,
  primary key (booking_id, task_id)
  -- 刻意不參照 tasks：刪除原待辦時，歷史成果仍保留。
);
alter table public.session_results enable row level security;
alter table public.session_result_tasks enable row level security;
revoke all on public.session_results, public.session_result_tasks from public, anon, authenticated;
grant select on public.session_results, public.session_result_tasks to authenticated;
create policy "Read own session results" on public.session_results for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Read own result tasks" on public.session_result_tasks for select to authenticated
  using (exists (select 1 from public.session_results r where r.booking_id = session_result_tasks.booking_id and r.user_id = (select auth.uid())));

-- 在預約建立時保存場次資訊，取消預約時由外鍵連帶移除。
create function public.track_booking_result() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.session_results(booking_id, user_id, session_id, title, starts_at, ends_at)
    select new.id, new.user_id, s.id, s.title, s.starts_at, s.ends_at
    from public.sessions s where s.id = new.session_id and s.ends_at > clock_timestamp();
  return new;
end;
$$;
create trigger track_booking_result after insert on public.bookings
  for each row execute function public.track_booking_result();

-- 場次尚未結束時才跟隨排程修改；結束後凍結日期、名稱與成果。
create function public.track_result_schedule() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.session_results set title = new.title, starts_at = new.starts_at, ends_at = new.ends_at
    where session_id = new.id and ends_at > clock_timestamp();
  return new;
end;
$$;
create trigger track_result_schedule after update of title, starts_at, ends_at on public.sessions
  for each row execute function public.track_result_schedule();

create function public.track_result_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.session_result_tasks rt using public.session_results r
      where rt.booking_id = old.booking_id and rt.task_id = old.task_id
        and r.booking_id = rt.booking_id and r.ends_at > clock_timestamp();
    return old;
  end if;
  insert into public.session_result_tasks(booking_id, task_id, title, completed)
    select new.booking_id, t.id, t.title, t.completed from public.tasks t
    join public.session_results r on r.booking_id = new.booking_id
    where t.user_id = new.user_id and t.id = new.task_id and r.ends_at > clock_timestamp()
    on conflict (booking_id, task_id) do update set title = excluded.title, completed = excluded.completed;
  return new;
end;
$$;
create trigger track_result_assignment after insert or delete on public.booking_tasks
  for each row execute function public.track_result_assignment();

-- 房間與我的待辦清單的修改都走同一份同步規則。
-- 不依賴使用者在結束時仍開著網頁，也不用排程工作。
create function public.track_result_task() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.session_result_tasks rt set title = new.title, completed = new.completed
    from public.session_results r where r.booking_id = rt.booking_id
      and r.user_id = new.user_id and rt.task_id = new.id and r.ends_at > clock_timestamp();
  return new;
end;
$$;
create trigger track_result_task after update of title, completed on public.tasks
  for each row execute function public.track_result_task();

insert into public.session_results(booking_id, user_id, session_id, title, starts_at, ends_at)
  select b.id, b.user_id, s.id, s.title, s.starts_at, s.ends_at
  from public.bookings b join public.sessions s on s.id = b.session_id where s.ends_at > clock_timestamp();
insert into public.session_result_tasks(booking_id, task_id, title, completed)
  select bt.booking_id, t.id, t.title, t.completed from public.booking_tasks bt
  join public.session_results r on r.booking_id = bt.booking_id
  join public.tasks t on t.user_id = bt.user_id and t.id = bt.task_id;

create function public.get_session_result(p_session_id uuid) returns jsonb
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
  if clock_timestamp() < v_result.ends_at then raise exception 'SESSION_NOT_ENDED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', task_id, 'title', title, 'completed', completed) order by task_id), '[]'::jsonb),
    count(*) filter (where completed) into v_tasks, v_completed
    from public.session_result_tasks where booking_id = v_result.booking_id;
  return jsonb_build_object('session_id', v_result.session_id, 'title', v_result.title,
    'starts_at', v_result.starts_at, 'ends_at', v_result.ends_at, 'tracking_started_at', v_result.tracking_started_at,
    'tasks', v_tasks, 'total_count', jsonb_array_length(v_tasks), 'completed_count', v_completed);
end;
$$;
revoke execute on function public.track_booking_result(), public.track_result_schedule(), public.track_result_assignment(), public.track_result_task() from public, anon, authenticated;
revoke execute on function public.get_session_result(uuid) from public, anon, authenticated;
grant execute on function public.get_session_result(uuid) to authenticated;
commit;
