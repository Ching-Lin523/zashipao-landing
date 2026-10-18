begin;
create table public.room_presence (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tab_id uuid not null,
  last_seen timestamptz not null default now(),
  primary key (session_id, user_id, tab_id)
);
alter table public.room_presence enable row level security;
revoke all on public.room_presence from public, anon, authenticated;

-- 每個分頁回報一次；僅同場預約者、開放時間內可以取得名單。
create or replace function public.room_presence_heartbeat(p_session_id uuid, p_tab_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_members jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_tab_id is null then raise exception 'INVALID_TAB'; end if;
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not v_session.is_published or clock_timestamp() < v_session.starts_at - interval '5 minutes'
    or clock_timestamp() >= v_session.ends_at then raise exception 'PRESENCE_CLOSED'; end if;
  if not exists(select 1 from public.bookings where session_id = p_session_id and user_id = v_user) then
    raise exception 'BOOKING_REQUIRED';
  end if;
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
create or replace function public.leave_room_presence(p_session_id uuid, p_tab_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.room_presence where session_id = p_session_id and user_id = auth.uid() and tab_id = p_tab_id;
end;
$$;
revoke execute on function public.room_presence_heartbeat(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.leave_room_presence(uuid,uuid) from public, anon, authenticated;
grant execute on function public.room_presence_heartbeat(uuid,uuid) to authenticated;
grant execute on function public.leave_room_presence(uuid,uuid) to authenticated;
commit;
