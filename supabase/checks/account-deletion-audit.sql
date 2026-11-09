-- 僅查詢，不刪除、不修改。由管理者在 Supabase SQL Editor 使用。
-- 將下方 UUID 換成已核實申請人的 auth.users.id；不要填信箱。
-- 零 UUID 是佔位值，未替換時會顯示 TARGET_NOT_FOUND，不代表刪除成功。
with target as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
), owned_bookings as (
  select b.id, b.session_id from public.bookings b, target t where b.user_id = t.user_id
)
select
  case when exists (select 1 from auth.users u, target t where u.id = t.user_id)
    then 'TARGET_EXISTS' else 'TARGET_NOT_FOUND' end as account_status,
  (select count(*) from public.tasks x, target t where x.user_id = t.user_id) as tasks,
  (select count(*) from owned_bookings) as bookings,
  (select count(*) from owned_bookings b join public.sessions s on s.id = b.session_id
    where s.ends_at > now()) as upcoming_or_active_bookings,
  (select count(*) from public.booking_tasks x, target t where x.user_id = t.user_id) as booking_tasks,
  (select count(*) from public.session_results x, target t where x.user_id = t.user_id) as results,
  (select count(*) from public.session_result_tasks x join public.session_results r using (booking_id), target t
    where r.user_id = t.user_id) as result_tasks,
  (select count(*) from public.room_presence x, target t where x.user_id = t.user_id) as presence_rows,
  (select count(*) from public.booking_events x, target t where x.user_id = t.user_id) as linked_booking_events;

-- 檢查目前資料庫的外鍵，與交接文件對照；包括其他後續新增的關聯。
select conrelid::regclass as source_table, conname,
       confrelid::regclass as referenced_table, pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and confrelid in ('auth.users'::regclass, 'public.tasks'::regclass,
                   'public.bookings'::regclass, 'public.session_results'::regclass)
order by source_table::text, conname;
